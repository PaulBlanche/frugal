import { className, keyframes } from '../dep/frugal/styled.ts';

const transitionDuration = 0.2;

export const wrapper = className('wrapper')
    .styled`
        position: relative;
        height: 58px;
        width: 58px;
    `;

export const hiddenInput = className('hidden-input')
    .styled`
        position: absolute;
        display: inline-block;
        cursor: pointer;
        opacity: 0;
        width: 0;
        height: 0;
        z-index: 0;
    `;

const open2 = keyframes`
    from {
        display: none
    }

    to {
        display: block;
    }
`;

const close2 = keyframes`
    from {
        display: block;
    }

    to {
        display: none
    }
`;

export const toc = className('toc')
    .styled`
        background-color: #fff;
        position: fixed;
        width: 256px;
        height: 100%;
        z-index: 1;
        top: 60px;
        left: 0;
        transform: translateX(-100%);
        transition: transform ${transitionDuration}s;
        animation-duration: ${transitionDuration}s; 
        animation-fill-mode: forwards;
        animation-delay: 0s;
        animation-name: ${close2};

        

        ${hiddenInput}:checked ~ & {
            transform: translateX(0);
            animation-duration: 0s; 
            animation-name: ${open2};
            animation-delay: 0s;

        }

    `;

const open = keyframes`
    from {
        position: static
    }

    to {
        position: fixed;
        top: 60px;
        left: 0;

    }
`;

const close = keyframes`
    from {
        position: fixed;
        top: 60px;
        left: 0;
    }

    to {
        position: static;
    }
`;

export const toggle = className('toggle')
    .styled`
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 2px solid #F0F0F0;
        border-bottom: 2px solid #F0F0F0;
        position: absolute;
        height: 60px;
        width: 60px;

        &:hover {
            border-color: #c6c6c6;
        }
    `;

export const overlay = className('overlay-label')
    .styled`
        display: block;
        width: 100%;
        height: 100%;
        transition: background-color ${transitionDuration}s;
        animation-duration: ${transitionDuration}s; 
        animation-fill-mode: forwards;
        animation-delay: 0s;
        animation-name: ${close};

        ${hiddenInput}:checked ~ &  {
            background-color: rgba(0, 0, 0, 0.5);
            animation-duration: 0s; 
            animation-name: ${open};
            animation-delay: 0s;

            ${toggle} {
                top: -60px;
            }
        }


        ${hiddenInput}:focus ~ & ${toggle} {
            border-color: #c6c6c6;
        }
    `;

export const icon = className('icon')
    .styled`
        width: 1.5rem;
        height: 1.5rem;
    `;
