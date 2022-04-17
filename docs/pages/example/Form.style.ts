import { styled } from '../../dep/frugal/styled.ts';

export const formWrapper = styled('form-wrapper')`
    background-color: #FFF8BB;
    margin: 2rem 0;
    padding: 1rem 2rem;
`;

export const form = styled('form')`
    padding: 2rem;
`;

export const input = styled('input')`
    padding: 0.5rem 1rem;
    font-size: 1rem;
    color: #555;
    width: 100%;
    margin: 0.5rem 0 0;
`;

export const error = styled('error')`
    margin: 0;
    position: absolute;
    bottom: 1rem;
    left: 0;
    font-size: 0.8rem;
    font-weight: bold;
    color: #C83939;
`;

export const field = styled('field')`
    flex-direction: column;
    display: flex;
    padding: 0 0 2.5rem;
    position: relative;
`;

export const submit = styled('submit')`
    border: none;
    border-radius: 0;
    background: #FFE300;
    padding: 0.75rem 1.5rem;
    margin: 1rem 0;
    font-size: 1rem;
    margin-left: auto;
`;

export const submitWrapper = styled('submitWrapper')`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
`;

export const success = styled('success')`
    color: #62792F;
    font-weight: bold;
`;
