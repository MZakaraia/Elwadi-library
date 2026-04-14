// --- DATA ---
const departments = [
    { id: 'mis', name: 'نظم المعلومات الإدارية', icon: 'fa-laptop-code', desc: 'كتب ومراجع في تحليل النظم، قواعد البيانات، والبرمجة.' },
    { id: 'acc', name: 'المحاسبة', icon: 'fa-calculator', desc: 'أهم الإصدارات في المحاسبة المالية، الإدارية، وتدقيق الحسابات.' },
    { id: 'bank', name: 'العلوم المصرفية والاستثمار', icon: 'fa-building-columns', desc: 'المراجع الأساسية في إدارة البنوك، محافظ الاستثمار، والأسواق.' },
    { id: 'mark', name: 'التسويق وإدارة الأعمال', icon: 'fa-bullseye', desc: 'كتب متخصصة في السلوك التنظيمي، إدارة الموارد البشرية، واستراتيجيات التسويق.' }
];


let books = [];
let users = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

async function loadData() {
    try {
        const booksRes = await fetch('/api/books');
        books = await booksRes.json();
        const usersRes = await fetch('/api/users');
        users = await usersRes.json();
    } catch(e) {
        console.error("Failed to load data from server", e);
    }
}


// --- STATE & ROUTER ---
let currentSearchQuery = '';
const appContent = document.getElementById('app-content');
const navLinksMenu = document.querySelector('.nav-links');
const authLinksMenu = document.getElementById('auth-links');

function updateAuthNav() {
    if (!authLinksMenu) return;
    authLinksMenu.innerHTML = '';
    if (currentUser) {
        if (currentUser.role === 'admin') {
            authLinksMenu.innerHTML += `<li><a href="#" data-link="admin" class="admin-link"><i class="fa-solid fa-gear ml-1"></i> لوحة التحكم</a></li>`;
        }
        authLinksMenu.innerHTML += `<li><a href="#profile" class="user-greeting"><i class="fa-solid fa-user-circle ml-1"></i> أهلاً، ${currentUser.name}</a></li>`;
        authLinksMenu.innerHTML += `<li><a href="#" id="logout-btn" class="logout-link"><i class="fa-solid fa-right-from-bracket ml-1"></i> خروج</a></li>`;
        
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateAuthNav();
            navigate('home');
        });
    } else {
        authLinksMenu.innerHTML = `
            <li><a href="#" data-link="login" class="login-link"><i class="fa-solid fa-user ml-1"></i> دخول</a></li>
            <li><a href="#" data-link="register" class="register-link btn-primary-sm pt-1 pb-1 pr-3 pl-3" style="border-radius:20px; color:#fff"><i class="fa-solid fa-user-plus ml-1"></i> حساب جديد</a></li>
        `;
    }
}

function navigate(viewName, params = '') {
    window.location.hash = viewName + (params ? `/${params}` : '');
}

async function handleRoute() {
    await loadData();

    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const view = parts[0];
    const id = parts[1];

    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    // Only highlight main nav items
    if(['home', 'departments', 'about'].includes(view)) {
        const activeLink = document.querySelector(`.nav-links a[data-link="${view}"]`);
        if(activeLink) activeLink.classList.add('active');
    }

    // Add enter animation
    appContent.classList.remove('view-enter-active');
    appContent.classList.add('view-enter');

    setTimeout(() => {
        renderView(view, id);
        // Trigger animation
        requestAnimationFrame(() => {
            appContent.classList.remove('view-enter');
            appContent.classList.add('view-enter-active');
        });
        window.scrollTo(0, 0);
    }, 150); // Small delay to let old view fade out
}

window.addEventListener('hashchange', handleRoute);

// Mobile menu
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinksMenu.classList.toggle('active');
    });
}

// Click listener for custom data-link attributes
document.body.addEventListener('click', e => {
    const linkEl = e.target.closest('[data-link]');
    if (linkEl) {
        e.preventDefault();
        navLinksMenu.classList.remove('active'); // close mobile menu on click
        navigate(linkEl.getAttribute('data-link'));
    }
});

// --- VIEWS ---
function renderView(view, id) {
    switch (view) {
        case 'home':
            appContent.innerHTML = renderHome();
            bindHomeEvents();
            break;
        case 'login':
            if (currentUser) { navigate('home'); return; }
            appContent.innerHTML = renderLogin();
            bindLoginEvents();
            break;
        case 'forgot':
            if (currentUser) { navigate('home'); return; }
            appContent.innerHTML = renderForgot();
            bindForgotEvents();
            break;
        case 'register':
            if (currentUser) { navigate('home'); return; }
            appContent.innerHTML = renderRegister();
            bindRegisterEvents();
            break;
        case 'admin':
            if (!currentUser || currentUser.role !== 'admin') { navigate('home'); return; }
            appContent.innerHTML = renderAdmin();
            bindAdminEvents();
            break;
        case 'profile':
            if (!currentUser) { navigate('login'); return; }
            appContent.innerHTML = renderProfile();
            bindProfileEvents();
            break;
        case 'departments':
            appContent.innerHTML = renderDepartments();
            bindDepartmentsEvents();
            break;
        case 'book':
            appContent.innerHTML = renderBookDetails(id);
            break;
        case 'about':
            appContent.innerHTML = renderAbout();
            break;
        default:
            appContent.innerHTML = renderNotFound();
    }
}

// Home View
function renderHome() {
    // Get one book from each dept for featured
    const featuredBooks = [
        books.find(b => b.deptId === 'mis'),
        books.find(b => b.deptId === 'acc'),
        books.find(b => b.deptId === 'bank'),
        books.find(b => b.deptId === 'mark')
    ].filter(Boolean);
    
    let html = `
        <section class="hero">
            <div class="hero-content">
                <h2>بوابتك للتميز الأكاديمي</h2>
                <p>اكتشف آلاف الكتب والمراجع العلمية في مختلف التخصصات الإدارية والمحاسبية والتسويقية</p>
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="ابحث عن كتاب، مؤلف، أو موضوع...">
                    <button id="searchBtn">البحث <i class="fa-solid fa-magnifying-glass mr-2"></i></button>
                </div>
            </div>
        </section>

        <section class="section container">
            <h2 class="section-title">الأقسام العلمية</h2>
            <div class="depts-grid">
                ${departments.map(dept => `
                    <div class="dept-card" onclick="location.hash='departments'">
                        <i class="fa-solid ${dept.icon} dept-icon"></i>
                        <h3>${dept.name}</h3>
                        <p>${dept.desc}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <section class="section container">
            <div style="background: var(--bg-surface); border-radius: 12px; padding: 3rem; box-shadow: var(--shadow-sm);">
                <h2 class="section-title">إصدارات حديثة ومميزة</h2>
                <div class="books-grid">
                    ${featuredBooks.map(book => generateBookCard(book)).join('')}
                </div>
                <div style="text-align: center; margin-top: 3rem;">
                    <button class="filter-btn active" onclick="location.hash='departments'" style="font-size: 1.1rem; padding: 0.8rem 2rem;">تصفح كل الكتب <i class="fa-solid fa-arrow-left-long mr-2"></i></button>
                </div>
            </div>
        </section>
    `;
    return html;
}

function bindHomeEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    searchBtn.addEventListener('click', () => {
        if(searchInput.value.trim()) {
            currentSearchQuery = searchInput.value.trim().toLowerCase();
            navigate('departments');
        }
    });

    // Support enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            currentSearchQuery = searchInput.value.trim().toLowerCase();
            navigate('departments');
        }
    });
}

// Departments View
function renderDepartments() {
    return `
        <section class="section container">
            <h2 class="section-title">تصفح الكتب والأقسام</h2>
            
            <div class="search-container" style="max-width: 600px; margin: 0 auto 2rem auto; display: flex;">
                <input type="text" id="deptSearchInput" placeholder="ابحث في جميع الكتب..." value="${currentSearchQuery}" style="flex: 1; padding: 0.8rem; border: 1px solid #ccc; border-radius: 0 8px 8px 0; font-family: 'Cairo', sans-serif;">
                <button id="deptSearchBtn" class="btn-primary" style="border-radius: 8px 0 0 8px; padding: 0.8rem 1.5rem;"><i class="fa-solid fa-search"></i></button>
            </div>

            <div class="filter-tabs">
                <button class="filter-btn active" data-filter="all">جميع الكتب</button>
                ${departments.map(d => `<button class="filter-btn" data-filter="${d.id}">${d.name}</button>`).join('')}
            </div>

            <div class="books-grid" id="books-container">
                <!-- Books rendered by JS -->
            </div>
        </section>
    `;
}

function bindDepartmentsEvents() {
    const booksContainer = document.getElementById('books-container');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function renderBooksList(filterId = 'all') {
        let filtered = filterId === 'all' ? books : books.filter(b => b.deptId === filterId);
        
        if (currentSearchQuery) {
            filtered = filtered.filter(b => 
                (b.title && b.title.toLowerCase().includes(currentSearchQuery)) ||
                (b.author && b.author.toLowerCase().includes(currentSearchQuery)) ||
                (b.desc && b.desc.toLowerCase().includes(currentSearchQuery))
            );
        }
        
        booksContainer.style.opacity = 0;
        
        setTimeout(() => {
            if(filtered.length === 0) {
                 booksContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted); font-size: 1.2rem;">لا توجد كتب في هذا القسم حالياً.</div>';
            } else {
                 booksContainer.innerHTML = filtered.map(b => generateBookCard(b)).join('');
            }
            booksContainer.style.opacity = 1;
            booksContainer.style.transition = "opacity 0.4s ease";
        }, 200);
    }

    renderBooksList();

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            const target = e.target;
            target.classList.add('active');
            renderBooksList(target.getAttribute('data-filter'));
        });
    });

    const deptSearchBtn = document.getElementById('deptSearchBtn');
    const deptSearchInput = document.getElementById('deptSearchInput');
    
    function performSearch() {
        currentSearchQuery = deptSearchInput.value.trim().toLowerCase();
        // keep current active filter
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const currentFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
        renderBooksList(currentFilter);
    }

    if (deptSearchBtn) {
        deptSearchBtn.addEventListener('click', performSearch);
        deptSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// Book Details View
function renderBookDetails(id) {
    const book = books.find(b => b.id == id);
    if (!book) return renderNotFound();

    const dept = departments.find(d => d.id === book.deptId);

    return `
        <section class="container" style="min-height: 70vh;">
            <a href="#departments" class="back-btn">
                <i class="fa-solid fa-arrow-right-long"></i> العودة لقائمة الكتب
            </a>
            
            <div class="book-details-view">
                <div class="details-cover">
                    <i class="fa-solid fa-book-journal-whills" style="font-size: 8rem; opacity: 0.15; position: absolute;"></i>
                    <h2>${book.title}</h2>
                </div>
                
                <div class="details-info">
                    <span class="details-dept-tag">${dept.name}</span>
                    <h1>${book.title}</h1>
                    <p class="details-author"><i class="fa-solid fa-pen-nib ml-2"></i> تأليف: ${book.author}</p>
                    
                    <div style="margin: 2rem 0; height: 1px; background: rgba(0,0,0,0.1);"></div>
                    
                    <h3 style="margin-bottom: 1rem; color: var(--primary-dark); font-size: 1.5rem;">نبذة عن الكتاب</h3>
                    <p class="details-desc">${book.desc}</p>
                    
                    <div style="margin: 2rem 0; height: 1px; background: rgba(0,0,0,0.1);"></div>

                    <div class="details-actions">
                        <button class="btn-primary" onclick="alert('تم فتح الكتاب للقراءة!')"><i class="fa-solid fa-book-open ml-2"></i> قراءة الآن</button>
                        <button class="btn-secondary" onclick="alert('تمت الإضافة للمفضلة!')"><i class="fa-solid fa-bookmark ml-2"></i> إضافة للمفضلة</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// About View
function renderAbout() {
    return `
        <section class="section container" style="min-height: 70vh;">
            <h2 class="section-title">عن المكتبة</h2>
            <div style="background: var(--bg-surface); padding: 4rem 2rem; border-radius: 12px; box-shadow: var(--shadow-sm); max-width: 800px; margin: 0 auto; text-align: center;">
                <i class="fa-solid fa-building-columns" style="font-size: 4rem; color: var(--primary-light); margin-bottom: 2rem;"></i>
                <h3 style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary-dark);">مكتبة معهد الوادي بالعبور</h3>
                <p style="font-size: 1.15rem; line-height: 1.8; color: var(--text-main); margin-bottom: 3rem;">
                    تعد مكتبة المعهد صرحاً علمياً متكاملاً يهدف إلى خدمة الطلاب وأعضاء هيئة التدريس والباحثين.
                    توفر المكتبة آلاف المصادر والمراجع والدوريات العلمية في تخصصات نظم المعلومات الإدارية، المحاسبة، 
                    العلوم المصرفية والاستثمار، والتسويق وإدارة الأعمال.
                </p>
                <div style="display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
                    <div style="padding: 1.5rem; background: var(--bg-main); border-radius: 12px; min-width: 200px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                        <h4 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 0.5rem;">5,000+</h4>
                        <p style="font-weight: 600;">كتاب ومرجع علمي</p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-main); border-radius: 12px; min-width: 200px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                        <h4 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 0.5rem;">4</h4>
                        <p style="font-weight: 600;">أقسام علمية متخصصة</p>
                    </div>
                    <div style="padding: 1.5rem; background: var(--bg-main); border-radius: 12px; min-width: 200px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                        <h4 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 0.5rem;">24/7</h4>
                        <p style="font-weight: 600;">وصول إلكتروني</p>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderNotFound() {
    return `
        <div class="container not-found">
            <i class="fa-solid fa-face-frown-open"></i>
            <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">عذراً، الصفحة المطلوبة غير موجودة</h2>
            <button class="filter-btn active" onclick="location.hash='home'">العودة للرئيسية <i class="fa-solid fa-home mr-2"></i></button>
        </div>
    `;
}

// Helpers
function generateBookCard(book) {
    const dept = departments.find(d => d.id === book.deptId);
    return `
        <div class="book-card">
            <div class="book-cover">
                <i class="fa-solid fa-book"></i>
                <h4>${book.title}</h4>
            </div>
            <div class="book-info">
                <div class="book-dept">${dept.name}</div>
                <h3 class="book-title">${book.title}</h3>
                <div class="book-author"><i class="fa-solid fa-pen-nib ml-1"></i> ${book.author}</div>
                <a href="#book/${book.id}" class="btn-read">التفاصيل وقراءة الكتاب <i class="fa-solid fa-arrow-left-long mr-2"></i></a>
            </div>
        </div>
    `;
}

// Init Application
document.addEventListener('DOMContentLoaded', () => {
    updateAuthNav();
    handleRoute();
});


// --- AUTH & ADMIN VIEWS ---
function renderLogin() {
    return `
        <section class="section container" style="min-height: 70vh; display: flex; align-items: center; justify-content: center;">
            <div class="auth-card">
                <i class="fa-solid fa-circle-user auth-icon"></i>
                <h2>تسجيل الدخول</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="login-email" required placeholder="student@elwadi.edu.eg">
                    </div>
                    <div class="form-group">
                        <label>كلمة المرور</label>
                        <input type="password" id="login-pass" required placeholder="••••••••">
                    </div>
                    <div id="login-error" class="error-text"></div>

                <div style="text-align: right; margin-top: -1rem; margin-bottom: 1.5rem;">
                    <a href="#forgot" style="font-size: 0.85rem; color: var(--primary-light);">هل نسيت كلمة المرور؟</a>
                </div>
                    <button type="submit" class="btn-primary w-100">دخول <i class="fa-solid fa-arrow-left ml-2"></i></button>
                </form>
                <div class="auth-footer">
                    ليس لديك حساب؟ <a href="#register">سجل الآن</a>
                </div>
            </div>
        </section>
    `;
}

function bindLoginEvents() {
    const form = document.getElementById('login-form');
    if(!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        const err = document.getElementById('login-error');
        
        const user = users.find(u => u.email === email && u.password === pass);
        if(user) {
            currentUser = { email: user.email, name: user.name, role: user.role };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthNav();
            navigate('home');
        } else {
            err.textContent = 'بيانات الدخول غير صحيحة';
        }
    });
}

function renderRegister() {
    return `
        <section class="section container" style="min-height: 70vh; display: flex; align-items: center; justify-content: center;">
            <div class="auth-card">
                <i class="fa-solid fa-user-plus auth-icon"></i>
                <h2>إنشاء حساب جديد</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label>الاسم الكامل</label>
                        <input type="text" id="reg-name" required placeholder="مثال: أحمد محمد">
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="reg-email" required placeholder="student@elwadi.edu.eg">
                    </div>
                    <div class="form-group">
                        <label>كلمة المرور</label>
                        <input type="password" id="reg-pass" required placeholder="••••••••">
                    </div>
                    <div id="reg-error" class="error-text"></div>
                    <button type="submit" class="btn-primary w-100">تسجيل حساب <i class="fa-solid fa-check ml-2"></i></button>
                </form>
                <div class="auth-footer">
                    لديك حساب بالفعل؟ <a href="#login">دخول</a>
                </div>
            </div>
        </section>
    `;
}

function bindRegisterEvents() {
    const form = document.getElementById('register-form');
    if(!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value.trim();
        const err = document.getElementById('reg-error');
        
        if (users.find(u => u.email === email)) {
            err.textContent = 'البريد الإلكتروني مسجل مسبقاً';
            return;
        }
        
        const newUser = { email, password: pass, name, role: 'user' };
        
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            await loadData();

        
        currentUser = { email: newUser.email, name: newUser.name, role: newUser.role };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthNav();
        navigate('home');
    });
}

function renderAdmin() {
    let usersListHtml = users.map((u, i) => {
        const isMaster = u.email === 'admin@elwadi.edu.eg';
        
        let actions = ``;
        if (isMaster) {
            actions = `<span style="color: green; font-size: 0.8rem;"><i class="fa-solid fa-crown"></i> المدير الأساسي</span>`;
        } else {
            const roleAction = u.role === 'admin' 
                ? `<button class="btn-secondary make-user-btn" data-email="${u.email}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-left: 0.5rem;"><i class="fa-solid fa-arrow-down mr-1"></i> سحب الصلاحيات</button>`
                : `<button class="btn-primary-sm make-admin-btn" data-email="${u.email}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-left: 0.5rem;"><i class="fa-solid fa-arrow-up mr-1"></i> ترقية لمدير</button>`;
                
            const deleteAction = `<button class="delete-user-btn" data-email="${u.email}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash mr-1"></i> حذف</button>`;
            
            actions = `<div style="display: flex; gap: 5px;">${roleAction} ${deleteAction}</div>`;
        }

        return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid #eee;">
            <div>
                <strong>${u.name}</strong> <br> <small>${u.email}</small> - <span style="font-size: 0.8rem; color: ${u.role === 'admin' ? 'var(--primary-light)' : 'var(--text-muted)'}">${u.role === 'admin' ? 'مدير النظام' : 'مستخدم عادي'}</span>
            </div>
            ${actions}
        </div>
        `;
    }).join('');

    return `
        <section class="section container">
            <h2 class="section-title">لوحة التحكم</h2>
            
            <div class="admin-dashboard">
                <!-- Section 1: Add Books -->
                <div class="admin-form">
                    <h3><i class="fa-solid fa-book-medical ml-2"></i> إضافة كتاب جديد</h3>
                    <form id="add-book-form" style="margin-top: 1rem;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>عنوان الكتاب</label>
                                <input type="text" id="b-title" required>
                            </div>
                            <div class="form-group">
                                <label>المؤلف</label>
                                <input type="text" id="b-author" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>القسم</label>
                            <select id="b-dept" required>
                                <option value="">-- اختر القسم --</option>
                                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>وصف / موضوعات الكتاب</label>
                            <textarea id="b-desc" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary"><i class="fa-solid fa-plus ml-2"></i> الإضافة للمكتبة</button>
                        <div id="add-success" class="success-text" style="display:none; margin-top:1rem; color:green;">تم إضافة الكتاب بنجاح!</div>
                    </form>
                </div>
                
                <!-- Section 2: Stats & Users -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="admin-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="stat-card" style="padding: 1.5rem;">
                            <i class="fa-solid fa-book" style="font-size: 2rem;"></i>
                            <h3 style="font-size: 1.1rem;">إجمالي الكتب</h3>
                            <p style="font-size: 1.8rem;" id="total-books-stat">${books.length}</p>
                        </div>
                        <div class="stat-card" style="padding: 1.5rem;">
                            <i class="fa-solid fa-users" style="font-size: 2rem;"></i>
                            <h3 style="font-size: 1.1rem;">المستخدمين</h3>
                            <p style="font-size: 1.8rem;" id="total-users-stat">${users.length}</p>
                        </div>
                    </div>
                    
                    <div class="admin-form">
                        <h3><i class="fa-solid fa-user-shield ml-2"></i> إدارة المديرين (Admins)</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">يمكنك ترقية أي مستخدم لديه حساب ليكون "مديراً" ليتمكن من إضافة الكتب.</p>
                        <div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem;" id="users-list-container">
                            ${usersListHtml}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function bindAdminEvents() {
    const form = document.getElementById('add-book-form');
    if(!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        
        const newBook = {
            id: Date.now(), // Generate unique ID
            title: document.getElementById('b-title').value.trim(),
            author: document.getElementById('b-author').value.trim(),
            deptId: document.getElementById('b-dept').value,
            desc: document.getElementById('b-desc').value.trim()
        };
        
        
        await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook)
        });
        await loadData();

        
        document.getElementById('add-success').style.display = 'block';
        setTimeout(() => { document.getElementById('add-success').style.display = 'none'; }, 3000);
        form.reset();
        
        // Update stats
        const stats = document.querySelectorAll('.stat-card p');
        if (stats[0]) stats[0].textContent = books.length;
    });

    // Admins logic
    const usersContainer = document.getElementById('users-list-container');
    if (usersContainer) {
        usersContainer.addEventListener('click', async e => {
            const targetBtn = e.target.closest('button');
            if (!targetBtn) return;
            
            const emailAct = targetBtn.getAttribute('data-email');
            const userIndex = users.findIndex(u => u.email === emailAct);
            
            if (userIndex !== -1) {
                const userName = users[userIndex].name;
                
                if (targetBtn.classList.contains('make-admin-btn')) {
                    await fetch('/api/users/' + emailAct, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: 'admin'}) });
                    await loadData();
                    alert(`تمت ترقية [${userName}] ليكون مديراً بنجاح!`);
                } 
                else if (targetBtn.classList.contains('make-user-btn')) {
                    await fetch('/api/users/' + emailAct, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: 'user'}) });
                    await loadData();
                    alert(`تم سحب صلاحيات الإدارة من [${userName}]. أصبح مستخدماً عادياً.`);
                }
                else if (targetBtn.classList.contains('delete-user-btn')) {
                    if (confirm(`هل أنت متأكد من حذف الحساب التابع لـ [${userName}] نهائياً؟`)) {
                        await fetch('/api/users/' + emailAct, { method: 'DELETE' });
                        await loadData();
                        alert('تم حذف المستخدم بنجاح.');
                    } else {
                        return; // cancelled
                    }
                }

                
                appContent.innerHTML = renderAdmin();
                bindAdminEvents();
            }
        });
    }
}


function renderForgot() {
    return `
        <section class="section container" style="min-height: 70vh; display: flex; align-items: center; justify-content: center;">
            <div class="auth-card">
                <i class="fa-solid fa-unlock-keyhole auth-icon"></i>
                <h2>استعادة كلمة المرور</h2>
                <div id="forgot-step-1">
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">يرجى إدخال بريدك الإلكتروني المسجل لدينا للبحث عن حسابك.</p>
                    <form id="forgot-form">
                        <div class="form-group">
                            <label>البريد الإلكتروني</label>
                            <input type="email" id="forgot-email" required placeholder="student@elwadi.edu.eg">
                        </div>
                        <div id="forgot-error" class="error-text"></div>
                        <button type="submit" class="btn-primary w-100">تحقق من الحساب</button>
                    </form>
                </div>
                
                <div id="forgot-step-2" style="display:none;">
                    <p style="font-size: 0.9rem; color: green; margin-bottom: 1.5rem;">تم العثور على الحساب. يرجى إدخال كلمة المرور الجديدة.</p>
                    <form id="reset-form">
                        <div class="form-group">
                            <label>كلمة المرور الجديدة</label>
                            <input type="password" id="new-pass" required placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn-primary w-100">تغيير كلمة المرور</button>
                    </form>
                </div>

                <div class="auth-footer">
                    تذكرت كلمة المرور؟ <a href="#login">دخول</a>
                </div>
            </div>
        </section>
    `;
}

function bindForgotEvents() {
    const forgotForm = document.getElementById('forgot-form');
    const resetForm = document.getElementById('reset-form');
    const step1 = document.getElementById('forgot-step-1');
    const step2 = document.getElementById('forgot-step-2');
    const err = document.getElementById('forgot-error');
    
    let foundUserEmail = null;

    if(forgotForm) {
        forgotForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const user = users.find(u => u.email === email);
            if(user) {
                foundUserEmail = email;
                step1.style.display = 'none';
                step2.style.display = 'block';
            } else {
                err.textContent = 'البريد الإلكتروني غير مسجل لدينا.';
            }
        });
    }

    if(resetForm) {
        resetForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newPass = document.getElementById('new-pass').value.trim();
            const userIndex = users.findIndex(u => u.email === foundUserEmail);
            if(userIndex !== -1) {
                await fetch('/api/users/' + foundUserEmail, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: newPass})
                });
                await loadData();
                alert('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
                navigate('login');
            }
        });
    }
}

function renderProfile() {
    return `
        <section class="section container">
            <h2 class="section-title">إعدادات الحساب</h2>
            
            <div class="admin-dashboard">
                <!-- Data Update Form -->
                <div class="admin-form">
                    <h3><i class="fa-solid fa-id-card ml-2"></i> بيانات الحساب الرئيسية</h3>
                    <form id="update-profile-form" style="margin-top: 1rem;">
                        <div class="form-group">
                            <label>البريد الإلكتروني (لا يمكن تغييره)</label>
                            <input type="email" value="${currentUser.email}" disabled style="background: #eee; cursor: not-allowed;">
                        </div>
                        <div class="form-group">
                            <label>الاسم الكامل</label>
                            <input type="text" id="p-name" value="${currentUser.name}" required>
                        </div>
                        <div class="form-group">
                            <label>صلاحية الحساب</label>
                            <input type="text" value="${currentUser.role === 'admin' ? 'مدير نظام (Admin)' : 'مستخدم عادي (User)'}" disabled style="background: #eee; cursor: not-allowed;">
                        </div>
                        <button type="submit" class="btn-primary"><i class="fa-solid fa-floppy-disk ml-2"></i> حفظ البيانات</button>
                        <div id="prof-success" class="success-text" style="display:none; margin-top:1rem; color:green;">تم تحديث الاسم بنجاح!</div>
                    </form>
                </div>

                <!-- Password Update Form -->
                <div class="admin-form">
                    <h3><i class="fa-solid fa-key ml-2"></i> تغيير كلمة المرور</h3>
                    <form id="update-pass-form" style="margin-top: 1rem;">
                        <div class="form-group">
                            <label>كلمة المرور الحالية</label>
                            <input type="password" id="old-pass" required placeholder="••••••••">
                        </div>
                        <div class="form-group">
                            <label>كلمة المرور الجديدة</label>
                            <input type="password" id="new-p-pass" required placeholder="••••••••">
                        </div>
                        <div id="pass-error" class="error-text"></div>
                        <button type="submit" class="btn-primary"><i class="fa-solid fa-shield ml-2"></i> تغيير كلمة المرور</button>
                        <div id="pass-success" class="success-text" style="display:none; margin-top:1rem; color:green;">تم تغيير كلمة المرور بنجاح!</div>
                    </form>
                </div>
            </div>
        </section>
    `;
}

function bindProfileEvents() {
    const profForm = document.getElementById('update-profile-form');
    const passForm = document.getElementById('update-pass-form');

    if(profForm) {
        profForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newName = document.getElementById('p-name').value.trim();
            if(newName) {
                // update current
                currentUser.name = newName;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // update in users array
                await fetch('/api/users/' + currentUser.email, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newName})
                });
                await loadData();
                
                updateAuthNav(); // update navbar name live
                
                document.getElementById('prof-success').style.display = 'block';
                setTimeout(() => { document.getElementById('prof-success').style.display = 'none'; }, 3000);
            }
        });
    }

    if(passForm) {
        passForm.addEventListener('submit', async e => {
            e.preventDefault();
            const oldP = document.getElementById('old-pass').value.trim();
            const newP = document.getElementById('new-p-pass').value.trim();
            const err = document.getElementById('pass-error');
            const succ = document.getElementById('pass-success');
            
            const userIndex = users.findIndex(u => u.email === currentUser.email);
            if(userIndex !== -1) {
                if(users[userIndex].password !== oldP) {
                    err.textContent = "كلمة المرور الحالية غير صحيحة!";
                    return;
                }
                
                // Set new password
                await fetch('/api/users/' + currentUser.email, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: newP})
                });
                await loadData();
                
                err.textContent = "";
                passForm.reset();
                succ.style.display = 'block';
                setTimeout(() => { succ.style.display = 'none'; }, 3000);
            }
        });
    }
}
