(function () {
    const track = document.getElementById('scroll-track');
    const thumb = document.getElementById('scroll-thumb');
    const container = document.getElementById('left-scrollbar');

    if (!track || !thumb || !container) return;

    let dragging = false;
    let trackRect = null;
    let thumbHeight = 60; // px

    function isScrollable() {
        return document.documentElement.scrollHeight > window.innerHeight + 1;
    }

    function updateMetrics() {
        trackRect = track.getBoundingClientRect();
        const doc = document.documentElement;
        const viewportH = window.innerHeight;
        const docH = doc.scrollHeight;

        if (docH <= 0) return;

        const viewportRatio = Math.min(1, viewportH / docH);
        const trackH = trackRect.height;
        const minThumb = 28; // minimum for accessibility
        thumbHeight = Math.max(minThumb, Math.round(trackH * viewportRatio));
        thumb.style.height = thumbHeight + 'px';
    }

    function updateThumbFromScroll() {
        if (!trackRect) updateMetrics();
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop;
        const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);

        if (maxScroll <= 0) {
            container.classList.add('hidden');
            thumb.style.transform = 'translateX(-50%) translateY(0)';
            thumb.setAttribute('aria-valuenow', '0');
            return;
        } else {
            container.classList.remove('hidden');
        }

        const trackH = trackRect.height;
        const maxThumbTop = trackH - thumbHeight;
        const progress = scrollTop / maxScroll;
        const top = Math.round(progress * maxThumbTop);

        thumb.style.transform = `translateX(-50%) translateY(${top}px)`;
        thumb.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    // requestAnimationFrame throttle
    let rafId = null;
    function requestUpdate() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateMetrics();
            updateThumbFromScroll();
        });
    }

    // Convert a pointer Y coordinate within the track to scroll position
    function pointerYToScroll(clientY) {
        const doc = document.documentElement;
        const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
        if (maxScroll <= 0) return 0;

        const y = Math.min(Math.max(clientY - trackRect.top, 0), trackRect.height);
        const ratio = (y - thumbHeight / 2) / (trackRect.height - thumbHeight);
        const clamped = Math.min(1, Math.max(0, ratio));
        return Math.round(clamped * maxScroll);
    }

    // pointer event handlers
    function onPointerDown(e) {
        e.preventDefault();
        dragging = true;
        track.setPointerCapture(e.pointerId);
        updateMetrics();
        const targetScroll = pointerYToScroll(e.clientY);
        window.scrollTo({ top: targetScroll, behavior: 'auto' });
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const targetScroll = pointerYToScroll(e.clientY);
        window.scrollTo({ top: targetScroll, behavior: 'auto' });
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    // keyboard support: up/down/page keys on thumb
    function onThumbKeydown(e) {
        const doc = document.documentElement;
        const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
        if (maxScroll <= 0) return;

        const step = Math.max(40, Math.round(window.innerHeight * 0.05));
        let top = window.scrollY || doc.scrollTop;
        if (e.key === 'ArrowDown') { top = Math.min(maxScroll, top + step); window.scrollTo({ top }); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { top = Math.max(0, top - step); window.scrollTo({ top }); e.preventDefault(); }
        else if (e.key === 'PageDown') { top = Math.min(maxScroll, top + window.innerHeight); window.scrollTo({ top }); e.preventDefault(); }
        else if (e.key === 'PageUp') { top = Math.max(0, top - window.innerHeight); window.scrollTo({ top }); e.preventDefault(); }
    }

    // click on track should jump to clicked position
    function onTrackClick(e) {
        // if clicked directly on thumb, let pointer handlers handle it
        if (e.target === thumb) return;
        updateMetrics();
        const targetScroll = pointerYToScroll(e.clientY);
        window.scrollTo({ top: targetScroll, behavior: 'auto' });
    }

    // wire events
    thumb.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    thumb.addEventListener('keydown', onThumbKeydown);
    track.addEventListener('click', onTrackClick);

    // initial setup
    requestUpdate();

    // also run once more after load (images/fonts may change layout)
    window.addEventListener('load', requestUpdate);
})();