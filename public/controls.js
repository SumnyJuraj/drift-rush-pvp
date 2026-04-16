export const Inputs = {
    left: false,
    right: false,
    useMobile: false,

    init() {
        const btn = document.getElementById('mobileToggle');
        const leftZone = document.getElementById('left-zone');
        const rightZone = document.getElementById('right-zone');

        // Nastavenie prepínača
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.useMobile = !this.useMobile;
                btn.style.background = this.useMobile ? 'green' : 'red';
                btn.textContent = `MOBILE MODE: ${this.useMobile ? 'ON' : 'OFF'}`;
                
                if (leftZone) leftZone.style.display = this.useMobile ? 'block' : 'none';
                if (rightZone) rightZone.style.display = this.useMobile ? 'block' : 'none';
                
                // Resetujeme vstupy pri prepnutí
                this.left = false;
                this.right = false;
            };
        }

        // Klávesnica (PC)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = false;
        });

        // Pomocná funkcia pre dotyk (Zóny)
        const setupZone = (zone, direction) => {
            if (!zone) return;

            // Používame addEventListener - je to bezpečnejšie
            zone.addEventListener('pointerdown', (e) => {
                // Toto zastaví označovanie textu a zoomovanie
                if (e.pointerType === 'touch') e.preventDefault();
                this[direction] = true;
            }, { passive: false });

            zone.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'touch') e.preventDefault();
                this[direction] = false;
            }, { passive: false });

            zone.addEventListener('pointerleave', (e) => {
                this[direction] = false;
            });

            // Úplne zakáže pravý klik a menu na zóne
            zone.addEventListener('contextmenu', (e) => e.preventDefault());
        };

        setupZone(leftZone, 'left');
        setupZone(rightZone, 'right');
    }
};