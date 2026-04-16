export const Inputs = {
    left: false,
    right: false,
    useMobile: false,

    init() {
        const btn = document.getElementById('mobileToggle');
        const leftZone = document.getElementById('left-zone');
        const rightZone = document.getElementById('right-zone');

        if (btn) {
            btn.onclick = () => {
                this.useMobile = !this.useMobile;
                btn.style.background = this.useMobile ? 'green' : 'red';
                btn.textContent = `MOBILE MODE: ${this.useMobile ? 'ON' : 'OFF'}`;
                leftZone.style.display = this.useMobile ? 'block' : 'none';
                rightZone.style.display = this.useMobile ? 'block' : 'none';
            };
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = true;
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.right = false;
        };

        const handleTouch = (zone, direction) => {
            if (!zone) return;
            zone.onpointerdown = (e) => { e.preventDefault(); this[direction] = true; };
            zone.onpointerup = (e) => { e.preventDefault(); this[direction] = false; };
            zone.onpointerleave = (e) => { e.preventDefault(); this[direction] = false; };
        };

        handleTouch(leftZone, 'left');
        handleTouch(rightZone, 'right');
    }
};