export const Inputs = {
    left: false,
    right: false,
    useMobile: false,
    
    // Interné premenné pre joystick
    isTouching: false,
    startX: 0,
    currentX: 0,
    threshold: 15, // Koľko pixelov treba pohnúť prstom, aby auto začalo zatáčať

    init() {
        const btn = document.getElementById('mobileToggle');
        const base = document.getElementById('joystick-base');
        const knob = document.getElementById('joystick-knob');

        // 1. Prepínač režimov
        btn.onclick = () => {
            this.useMobile = !this.useMobile;
            btn.style.background = this.useMobile ? 'green' : 'red';
            btn.textContent = `MOBILE MODE: ${this.useMobile ? 'ON' : 'OFF'}`;
            // Resetujeme klávesy pri prepnutí
            this.left = this.right = false;
        };

        // 2. Klávesnica (ostáva pre PC)
        window.onkeydown = (e) => {
            if (this.useMobile) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = true;
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = false;
        };

        // 3. Pointer udalosti (Myš aj Dotyk)
        window.onpointerdown = (e) => {
            if (!this.useMobile) return;
            // Ignorujeme kliknutie na tlačidlo toggle
            if (e.target.id === 'mobileToggle') return;

            this.isTouching = true;
            this.startX = e.clientX;
            
            // Zobrazenie vizuálneho joysticku na mieste dotyku
            base.style.display = 'block';
            base.style.left = `${this.startX - 40}px`;
            base.style.top = `${e.clientY - 40}px`;
            knob.style.transform = `translateX(0px)`;
        };

        window.onpointermove = (e) => {
            if (!this.isTouching || !this.useMobile) return;

            // Výpočet horizontálneho rozdielu
            const diffX = e.clientX - this.startX;
            // Obmedzenie pohybu guličky joysticku na max 30px do strán
            const constrainedX = Math.max(-30, Math.min(30, diffX));
            knob.style.transform = `translateX(${constrainedX}px)`;

            // Nastavenie logických kláves na základe pohybu
            this.left = diffX < -this.threshold;
            this.right = diffX > this.threshold;
        };

        window.onpointerup = () => {
            this.isTouching = false;
            this.left = this.right = false;
            base.style.display = 'none';
        };
    }
};