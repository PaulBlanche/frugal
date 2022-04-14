import { styled } from '../../packages/loader_style/styled.ts';
import { container } from '../styles/container.style.ts';
import { baseLink } from '../styles/link.style.ts';

export const wrapper = styled('wrapper')`
    display: block;
    background: #F8F8F8;
    border-bottom: 2px solid #F0F0F0;
`;

export const navigation = styled('navigation', container)`
    display: flex;
    flex-direction: row;
    justify-content: center;
    font-size: 0.9rem;
`;

export const entry = styled('entry', baseLink)`
    padding: 1rem;
    margin: 0 1rem;
    opacity: 0.6;
    text-decoration-line: none;

    &:hover, &:focus {
        text-decoration-line: underline;
    }
`;

export const entryActive = styled('entry-active')`
    opacity: 1;
    font-weight: bold;
    text-decoration-line: underline;
`;
