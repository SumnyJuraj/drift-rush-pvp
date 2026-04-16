export const Inputs = {
    left: false,
    right: false,
    useMobile: false,

    init() {
        const btn = document.getElementById('mobileToggle');
        const leftZone = document.getElementById('left-zone');
        const rightZone = document.getElementById('right-zone');

        btn.onclick = () => {
            this.useMobile = !this.useMobile;
            btn.style.background = this.useMobile ? 'green' : 'red';
            btn.textContent = `MOBILE MODE: ${this.useMobile ? 'ON' : 'OFF'}`;
            // Zobrazenie zón pre dotyk
            leftZone.style.display = this.useMobile ? 'block' : 'none';
            rightZone.style.display = this.useMobile ? 'block' : 'none';
        };

        // Klávesnica ostáva pre PC testovanie
        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = true;
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = false;
        };

        // DOTYKOVÁ LOGIKA (Zóny)
        const handleTouch = (zone, direction, state) => {
            zone.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this[direction] = state;
            });
            zone.addEventListener('pointerup', (e) => {
                e.preventDefault();
                this[direction] = !state;
            });
            zone.addEventListener('pointerleave', (e) => {
                e.preventDefault();
                this[direction] = !state;
            });
        };

        handleTouch(leftZone, 'left', true);
        handleTouch(rightZone, 'right', true);
    }
};