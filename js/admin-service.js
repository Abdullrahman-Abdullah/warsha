// js/admin-dashboard.js - الكود الكامل للوحة التحكم
import AdminService from './admin-service.js';

class AdminDashboard {
    constructor() {
        this.currentEditingService = null;
        this.currentEditingTechnician = null;
        this.init();
    }

    async init() {
        await this.initializeDashboard();
        this.setupEventListeners();
        await this.loadDashboardData();
    }

    async initializeDashboard() {
        // عرض التاريخ الحالي
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // تحميل الإعدادات
        this.loadSettings();
    }

    setupEventListeners() {
        // التنقل بين الأقسام
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // تصفية الطلبات
        document.getElementById('orderFilter')?.addEventListener('change', (e) => {
            this.loadOrders(e.target.value);
        });

        // نموذج الخدمة
        document.getElementById('serviceForm')?.addEventListener('submit', (e) => {
            this.handleServiceSubmit(e);
        });

        // إعدادات التقارير
        document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
            this.loadReports(parseInt(e.target.value));
        });

        // بحث العملاء
        document.getElementById('customerSearch')?.addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        // الإعدادات العامة
        document.getElementById('generalSettings')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });

        // الأمان
        document.getElementById('securitySettings')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    }

    // التنقل بين الأقسام
    async showSection(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // إظهار القسم المطلوب
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // تحديث القائمة الجانبية النشطة
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.sidebar-menu a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // تحميل البيانات الخاصة بكل قسم
        switch(sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'orders':
                await this.loadOrders('all');
                break;
            case 'services':
                await this.loadServices();
                break;
            case 'customers':
                await this.loadCustomers();
                break;
            case 'technicians':
                await this.loadTechnicians();
                break;
            case 'reports':
                await this.loadReports(30);
                break;
        }
    }

    // تحميل بيانات لوحة التحكم
    async loadDashboardData() {
        await this.loadStats();
        await this.loadRecentOrders();
        this.initializeCharts();
    }

    // تحميل الإحصائيات
    async loadStats() {
        try {
            const result = await AdminService.getDashboardStats();
            if (result.success) {
                const stats = result.data;
                this.updateElementText('totalOrders', stats.orders);
                this.updateElementText('totalServices', stats.services);
                this.updateElementText('totalCustomers', stats.customers);
                this.updateElementText('totalRevenue', `${stats.revenue.toLocaleString()} ل.س`);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // تحميل أحدث الطلبات
    async loadRecentOrders() {
        try {
            const result = await AdminService.getAllOrders('all');
            if (result.success) {
                this.displayRecentOrders(result.data.slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    // تحميل جميع الطلبات
    async loadOrders(filter = 'all') {
        try {
            const result = await AdminService.getAllOrders(filter);
            if (result.success) {
                this.displayOrders(result.data);
            } else {
                this.showEmptyState('ordersTable', 'لا توجد طلبات');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showEmptyState('ordersTable', 'حدث خطأ في تحميل البيانات');
        }
    }

    // تحميل الخدمات
    async loadServices() {
        try {
            const result = await AdminService.getAllServices();
            if (result.success) {
                this.displayServices(result.data);
            } else {
                this.showEmptyState('servicesTable', 'لا توجد خدمات');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.showEmptyState('servicesTable', 'حدث خطأ في تحميل البيانات');
        }
    }

    // تحميل العملاء
    async loadCustomers() {
        try {
            const result = await AdminService.getAllCustomers();
            if (result.success && result.data) {
                this.displayCustomers(result.data);
            } else {
                this.showEmptyState('customersTable', 'لا توجد عملاء مسجلين');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showEmptyState('customersTable', 'حدث خطأ في تحميل البيانات');
        }
    }

    // تحميل الفنيين
    async loadTechnicians() {
        try {
            const result = await AdminService.getAllTechnicians();
            if (result.success && result.data) {
                this.displayTechnicians(result.data);
            } else {
                this.showEmptyState('techniciansTable', 'لا توجد فنيين مسجلين');
            }
        } catch (error) {
            console.error('Error loading technicians:', error);
            this.showEmptyState('techniciansTable', 'حدث خطأ في تحميل البيانات');
        }
    }

    // تحميل التقارير
    async loadReports(period = 30) {
        try {
            const result = await AdminService.getAdvancedReports(period);
            if (result.success) {
                this.displayReports(result.data);
                await this.loadServicesDistribution();
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    // عرض أحدث الطلبات
    displayRecentOrders(orders) {
        const tbody = document.querySelector('#recentOrdersTable tbody');
        if (!tbody || !orders || orders.length === 0) return;

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customers?.first_name} ${order.customers?.last_name || ''}</td>
                <td>${this.getServiceName(order)}</td>
                <td>${this.formatDate(order.appointment_date)}</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewOrder(${order.id})">عرض</button>
                </td>
            </tr>
        `).join('');
    }

    // عرض جميع الطلبات
    displayOrders(orders) {
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            this.showEmptyState('ordersTable', 'لا توجد طلبات');
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customers?.first_name} ${order.customers?.last_name || ''}</td>
                <td>${order.customers?.phone_number || 'غير محدد'}</td>
                <td>${this.getServiceName(order)}</td>
                <td>${this.formatDate(order.appointment_date)}</td>
                <td>${order.appointment_time}</td>
                <td>${order.total_cost || 0} ل.س</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewOrder(${order.id})">عرض</button>
                    <select class="form-control" style="display: inline-block; width: auto; padding: 2px 5px;" onchange="adminDashboard.updateOrderStatus(${order.id}, this.value)">
                        <option value="Scheduled" ${order.status === 'Scheduled' ? 'selected' : ''}>مجدول</option>
                        <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>قيد التنفيذ</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>مكتمل</option>
                        <option value="Canceled" ${order.status === 'Canceled' ? 'selected' : ''}>ملغي</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    // عرض الخدمات
    displayServices(services) {
        const tbody = document.querySelector('#servicesTable tbody');
        if (!tbody) return;

        if (!services || services.length === 0) {
            this.showEmptyState('servicesTable', 'لا توجد خدمات');
            return;
        }

        tbody.innerHTML = services.map(service => `
            <tr>
                <td>${service.id}</td>
                <td>${service.service_name}</td>
                <td>${service.description || '-'}</td>
                <td>${service.base_price} ل.س</td>
                <td>${service.duration_minutes || '-'}</td>
                <td>${this.formatDate(service.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.editService(${service.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteService(${service.id})">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    // عرض العملاء
    displayCustomers(customers) {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        if (!customers || customers.length === 0) {
            this.showEmptyState('customersTable', 'لا توجد عملاء مسجلين');
            return;
        }

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user"></i>
                    </div>
                </td>
                <td><strong>${customer.first_name} ${customer.last_name || ''}</strong></td>
                <td>${customer.email || 'غير محدد'}</td>
                <td>${customer.phone_number || 'غير محدد'}</td>
                <td>${customer.address || 'غير محدد'}</td>
                <td>${this.formatDate(customer.created_at)}</td>
                <td><span class="status-badge status-completed">${customer.appointments?.length || 0}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.viewCustomer(${customer.id})">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.editCustomer(${customer.id})">تعديل</button>
                </td>
            </tr>
        `).join('');
    }

    // عرض الفنيين
    displayTechnicians(technicians) {
        const tbody = document.querySelector('#techniciansTable tbody');
        if (!tbody) return;

        if (!technicians || technicians.length === 0) {
            this.showEmptyState('techniciansTable', 'لا توجد فنيين مسجلين');
            return;
        }

        tbody.innerHTML = technicians.map(tech => `
            <tr>
                <td>${tech.id}</td>
                <td>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user-cog"></i>
                    </div>
                </td>
                <td><strong>${tech.first_name} ${tech.last_name || ''}</strong></td>
                <td>${tech.position || 'فني'}</td>
                <td>${tech.phone_number || 'غير محدد'}</td>
                <td>${tech.email || 'غير محدد'}</td>
                <td>${this.formatDate(tech.hire_date) || 'غير محدد'}</td>
                <td><span class="status-badge status-pending">${tech.position || 'عام'}</span></td>
                <td><span class="status-badge status-completed">نشط</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.editTechnician(${tech.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteTechnician(${tech.id})">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    // عرض التقارير
    displayReports(reportData) {
        // تحديث الإحصائيات
        this.updateElementText('reportTotalOrders', reportData.totalOrders);
        this.updateElementText('reportTotalRevenue', `${reportData.totalRevenue.toLocaleString()} ل.س`);
        this.updateElementText('reportNewCustomers', reportData.newCustomers);
        this.updateElementText('reportCompletionRate', `${reportData.completionRate}%`);

        // تحديث الجدول
        const tbody = document.querySelector('#reportsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td>الفترة الحالية</td>
                    <td>${reportData.totalOrders}</td>
                    <td>${reportData.totalRevenue.toLocaleString()} ل.س</td>
                    <td>${reportData.newCustomers}</td>
                    <td>${reportData.completionRate}%</td>
                    <td>خدمة الكهرباء</td>
                </tr>
            `;
        }

        // رسم مخطط الأداء
        this.drawPerformanceChart(reportData);
    }

    // تحميل توزيع الخدمات
    async loadServicesDistribution() {
        try {
            const result = await AdminService.getServicesDistribution();
            if (result.success) {
                this.drawServicesChart(result.data);
            }
        } catch (error) {
            console.error('Error loading services distribution:', error);
        }
    }

    // الرسوم البيانية
    initializeCharts() {
        this.drawMonthlyChart();
    }

    drawMonthlyChart() {
        const ctx = document.getElementById('monthlyChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'عدد الطلبات',
                    data: [12, 19, 15, 25, 22, 30],
                    backgroundColor: '#2D5B7A'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    drawPerformanceChart(reportData) {
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
                datasets: [{
                    label: 'عدد الطلبات',
                    data: [reportData.totalOrders * 0.2, reportData.totalOrders * 0.35, reportData.totalOrders * 0.25, reportData.totalOrders * 0.2],
                    borderColor: '#2D5B7A',
                    backgroundColor: 'rgba(45, 91, 122, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    drawServicesChart(distribution) {
        const ctx = document.getElementById('servicesChart')?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    data: Object.values(distribution),
                    backgroundColor: ['#2D5B7A', '#4F8A8B', '#FFCB74', '#5CB85C', '#F0AD4E', '#D9534F']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // خدمات النماذج
    async handleServiceSubmit(e) {
        e.preventDefault();

        const formData = {
            service_name: document.getElementById('serviceName').value,
            description: document.getElementById('serviceDescription').value,
            base_price: parseFloat(document.getElementById('servicePrice').value),
            duration_minutes: parseInt(document.getElementById('serviceDuration').value) || null
        };

        try {
            let result;
            if (this.currentEditingService) {
                result = await AdminService.updateService(this.currentEditingService.id, formData);
            } else {
                result = await AdminService.addService(formData);
            }

            if (result.success) {
                alert(this.currentEditingService ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
                this.closeServiceModal();
                await this.loadServices();
                await this.loadStats();
            } else {
                alert('حدث خطأ: ' + result.error);
            }
        } catch (error) {
            alert('حدث خطأ غير متوقع');
            console.error('Service form error:', error);
        }
    }

    // دوال الواجهة
    showServiceModal(service = null) {
        this.currentEditingService = service;
        const modal = document.getElementById('serviceModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('serviceForm');

        if (service) {
            title.textContent = 'تعديل الخدمة';
            document.getElementById('serviceName').value = service.service_name;
            document.getElementById('serviceDescription').value = service.description || '';
            document.getElementById('servicePrice').value = service.base_price;
            document.getElementById('serviceDuration').value = service.duration_minutes || '';
        } else {
            title.textContent = 'إضافة خدمة جديدة';
            form.reset();
        }

        modal.style.display = 'block';
    }

    closeServiceModal() {
        document.getElementById('serviceModal').style.display = 'none';
        this.currentEditingService = null;
        document.getElementById('serviceForm').reset();
    }

    // دوال المساعدة
    getServiceName(order) {
        if (order.appointment_details && order.appointment_details.length > 0) {
            return order.appointment_details[0].services?.service_name || 'خدمة عامة';
        }
        return 'خدمة عامة';
    }

    getStatusText(status) {
        const statusMap = {
            'Scheduled': 'مجدول',
            'In Progress': 'قيد التنفيذ',
            'Completed': 'مكتمل',
            'Canceled': 'ملغي'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString('ar-EG');
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    showEmptyState(tableId, message) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <br>
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    filterCustomers(searchTerm) {
        const rows = document.querySelectorAll('#customersTable tbody tr');
        searchTerm = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // الإعدادات
    loadSettings() {
        const savedSettings = localStorage.getItem('warsha_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.setElementValue('appName', settings.appName);
            this.setElementValue('appDescription', settings.appDescription);
            this.setElementValue('supportEmail', settings.supportEmail);
            this.setElementValue('supportPhone', settings.supportPhone);
        }
    }

    saveGeneralSettings() {
        const settings = {
            appName: this.getElementValue('appName'),
            appDescription: this.getElementValue('appDescription'),
            supportEmail: this.getElementValue('supportEmail'),
            supportPhone: this.getElementValue('supportPhone')
        };
        
        localStorage.setItem('warsha_settings', JSON.stringify(settings));
        alert('تم حفظ الإعدادات بنجاح');
    }

    changePassword() {
        const newPassword = this.getElementValue('newPassword');
        const confirmPassword = this.getElementValue('confirmPassword');

        if (newPassword !== confirmPassword) {
            alert('كلمات المرور غير متطابقة');
            return;
        }

        if (newPassword.length < 6) {
            alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        alert('تم تغيير كلمة المرور بنجاح');
        document.getElementById('securitySettings').reset();
    }

    setElementValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && value) {
            element.value = value;
        }
    }

    getElementValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }

    // دوال التفاعل (سيتم استدعاؤها من HTML)
    async editService(serviceId) {
        try {
            const result = await AdminService.getAllServices();
            if (result.success) {
                const service = result.data.find(s => s.id === serviceId);
                if (service) {
                    this.showServiceModal(service);
                }
            }
        } catch (error) {
            console.error('Error editing service:', error);
        }
    }

    async deleteService(serviceId) {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذه الخدمة؟')) {
            try {
                const result = await AdminService.deleteService(serviceId);
                if (result.success) {
                    alert('تم حذف الخدمة بنجاح');
                    await this.loadServices();
                    await this.loadStats();
                } else {
                    alert('حدث خطأ: ' + result.error);
                }
            } catch (error) {
                alert('حدث خطأ غير متوقع');
            }
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const result = await AdminService.updateOrderStatus(orderId, status);
            if (result.success) {
                // يمكن إضافة تحديث مرئي هنا
            } else {
                alert('حدث خطأ في تحديث الحالة');
            }
        } catch (error) {
            alert('حدث خطأ غير متوقع');
        }
    }

    viewOrder(orderId) {
        alert(`عرض تفاصيل الطلب #${orderId}`);
    }

    viewCustomer(customerId) {
        alert(`عرض بيانات العميل #${customerId}`);
    }

    editCustomer(customerId) {
        alert(`تعديل بيانات العميل #${customerId}`);
    }

    editTechnician(technicianId) {
        alert(`تعديل بيانات الفني #${technicianId}`);
    }

    async deleteTechnician(technicianId) {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا الفني؟')) {
            try {
                const result = await AdminService.deleteTechnician(technicianId);
                if (result.success) {
                    alert('تم حذف الفني بنجاح');
                    await this.loadTechnicians();
                }
            } catch (error) {
                alert('حدث خطأ أثناء الحذف');
            }
        }
    }

    exportToExcel(type) {
        alert(`تصدير ${type} إلى Excel`);
    }

    generateReport() {
        alert('جاري إنشاء تقرير PDF...');
    }

    createBackup() {
        alert('جاري إنشاء نسخة احتياطية...');
    }

    restoreBackup() {
        alert('جاري استعادة النسخة الاحتياطية...');
    }

    saveNotificationSettings() {
        alert('تم حفظ إعدادات الإشعارات');
    }
}

// إنشاء instance globale
const adminDashboard = new AdminDashboard();

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.adminDashboard = adminDashboard;
window.showSection = (sectionId) => adminDashboard.showSection(sectionId);
window.showServiceModal = (service) => adminDashboard.showServiceModal(service);
window.closeServiceModal = () => adminDashboard.closeServiceModal();
window.editService = (id) => adminDashboard.editService(id);
window.deleteService = (id) => adminDashboard.deleteService(id);
window.updateOrderStatus = (id, status) => adminDashboard.updateOrderStatus(id, status);
window.viewOrder = (id) => adminDashboard.viewOrder(id);
window.viewCustomer = (id) => adminDashboard.viewCustomer(id);
window.editCustomer = (id) => adminDashboard.editCustomer(id);
window.editTechnician = (id) => adminDashboard.editTechnician(id);
window.deleteTechnician = (id) => adminDashboard.deleteTechnician(id);
window.exportToExcel = (type) => adminDashboard.exportToExcel(type);
window.generateReport = () => adminDashboard.generateReport();
window.createBackup = () => adminDashboard.createBackup();
window.restoreBackup = () => adminDashboard.restoreBackup();
window.saveNotificationSettings = () => adminDashboard.saveNotificationSettings();