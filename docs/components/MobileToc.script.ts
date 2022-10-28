export const WRAPPER_ID = 'mobile-toc-wrapper';

export function main() {
    const wrapper = document.getElementById(WRAPPER_ID);
    if (wrapper) {
        const label = wrapper!.querySelector('label')!;
        const input = document.getElementById(
            label.htmlFor,
        )! as HTMLInputElement;

        input.addEventListener('change', () => update(input));
        update(input);
    }
    function update(input: HTMLInputElement) {
        if (input.checked) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }
}
