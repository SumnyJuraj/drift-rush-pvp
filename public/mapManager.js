export const MapManager = {
    currentMap: null,
    finishLinePoint: null, // TÁTO PREMENNÁ TU MUSÍ BYŤ

    loadMap(mapData) {
        this.currentMap = mapData;
    },

    draw(ctx) {
        if (!this.currentMap || !this.currentMap.points.length) return;

        const p = this.currentMap.points;
        
        // 1. Vykreslenie cesty
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = this.currentMap.trackWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // 2. Vykreslenie čiary - IBA ak už bola vypočítaná v resetPlayerToStart
        if (this.finishLinePoint) {
            this.drawFinishLine(ctx);
        }

        // 3. Stredová prerušovaná čiara
        ctx.beginPath();
        ctx.strokeStyle = '#444';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
    },

    drawFinishLine(ctx) {
        const { x, y, angle } = this.finishLinePoint;
        const halfWidth = this.currentMap.trackWidth / 2;

        const perpX = Math.cos(angle + Math.PI / 2);
        const perpY = Math.sin(angle + Math.PI / 2);

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#00FF00"; // Žiarivá zelená
        ctx.lineWidth = 10; // Trochu hrubšia, aby vynikla
        ctx.moveTo(x + perpX * halfWidth, y + perpY * halfWidth);
        ctx.lineTo(x - perpX * halfWidth, y - perpY * halfWidth);
        ctx.stroke();
        
        // Prerušovaný efekt pre športovejší vzhľad
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.setLineDash([15, 15]);
        ctx.stroke();
        ctx.restore();
},

    distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    },

    isOutOfBounds(px, py) {
        if (!this.currentMap) return false;
        const p = this.currentMap.points;
        const halfWidth = this.currentMap.trackWidth / 2;
        let minDistance = Infinity;

        for (let i = 0; i < p.length; i++) {
            const p1 = p[i];
            const p2 = p[(i + 1) % p.length];
            const d = this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
            if (d < minDistance) minDistance = d;
        }
        return minDistance > halfWidth;
    }
};