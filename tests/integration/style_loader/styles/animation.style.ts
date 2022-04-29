import {
    className,
    keyframes,
} from '../../../../packages/loader_style/styled.ts';

const keyframe = keyframes`
  from {
    color: red;
  }

  to {
    color: blue;
  }
`;

export const animated = className('animated').styled`
      animation: ${keyframe};
`;
