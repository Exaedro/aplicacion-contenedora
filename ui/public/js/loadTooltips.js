
window.addEventListener('DOMContentLoaded', () => {
    const modules = document.querySelectorAll('.sidebar a');

    modules.forEach(a => {
        tippy(a, {
            content: a.dataset.name,
            delay: [200, 0],
            placement: 'right',
            onShow(instance) {
                const { props } = instance;
                if (props.placement === 'top') props.arrow = false;
            }
        });
    });
});