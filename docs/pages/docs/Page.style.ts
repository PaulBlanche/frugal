import { styled } from '../../dep/frugal/styled.ts';
import { container } from '../../styles/container.style.ts';

export const wrapper = styled('wrapper', container)`
    display: flex;
    flex-direction: row;
`;

export const navigation = styled('navigation')`
  flex: 0 0 300px;
`;

export const main = styled('main')`
    flex: 1;
`;
