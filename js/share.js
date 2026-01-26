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
        <div class="share-inline-group">
            <a href="#" class="share-action" data-type="whatsapp" title="WhatsApp" aria-label="Compartir en WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" class="share-action" data-type="email" title="Email" aria-label="Compartir por Email">
                <i class="fa-solid fa-envelope"></i>
            </a>
            <a href="#" class="share-action" data-type="copy" title="Copiar Enlace" aria-label="Copiar Enlace">
                <i class="fa-solid fa-link"></i>
            </a>
        </div>
    `;

    // 3. Insert into Navbar
    navLinks.appendChild(shareLi);

    // 4. Handle Logic
    const actions = shareLi.querySelectorAll('.share-action');

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
        });
    });
}

// Auto-init just in case, but exporting implies modular use. 
// We will call it manually in script tags or auto-run if module
initShare();
