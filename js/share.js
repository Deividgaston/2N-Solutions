/**
 * Share Logic for 2N Solutions
 * Injects a share button into the navbar and handles social sharing.
 */

export function initShare() {
    // 1. Find Navbar Links
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // 2. Create Share Item
    const shareLi = document.createElement('li');
    shareLi.className = 'share-item';
    shareLi.innerHTML = `
        <button class="share-trigger" aria-label="Compartir">
            <i class="fa-solid fa-share-nodes"></i>
        </button>
        <div class="share-dropdown">
            <a href="#" class="share-action" data-type="whatsapp" title="WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" class="share-action" data-type="email" title="Email">
                <i class="fa-solid fa-envelope"></i>
            </a>
            <a href="#" class="share-action" data-type="copy" title="Copiar Enlace">
                <i class="fa-solid fa-link"></i>
            </a>
        </div>
    `;

    // 3. Insert into Navbar (before the last item usually, or at end)
    // We'll append it to the end of the list
    navLinks.appendChild(shareLi);

    // 4. Handle Logic
    const trigger = shareLi.querySelector('.share-trigger');
    const dropdown = shareLi.querySelector('.share-dropdown');
    const actions = shareLi.querySelectorAll('.share-action');

    // Toggle Dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        shareLi.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!shareLi.contains(e.target)) {
            shareLi.classList.remove('active');
        }
    });

    // Handle Actions
    actions.forEach(action => {
        action.addEventListener('click', (e) => {
            e.preventDefault();
            const type = action.dataset.type;
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            const text = encodeURIComponent("Echa un vistazo a esta solución de 2N: ");

            if (type === 'whatsapp') {
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
            } else if (type === 'email') {
                window.location.href = `mailto:?subject=${title}&body=${text}%20${url}`;
            } else if (type === 'copy') {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    // Visual feedback
                    const originalIcon = action.innerHTML;
                    action.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => action.innerHTML = originalIcon, 2000);
                });
            }
            // Close dropdown after action
            shareLi.classList.remove('active');
        });
    });
}

// Auto-init just in case, but exporting implies modular use. 
// We will call it manually in script tags or auto-run if module
initShare();
