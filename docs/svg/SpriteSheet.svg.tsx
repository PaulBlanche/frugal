/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { SpriteSheet } from '../dep/frugal/spritesheet.ts';
import { render } from 'preact-render-to-string';

export const spritesheet = new SpriteSheet({ render, name: 'svg' });

const CarretSprite = spritesheet.sprite(
    <path d='M14,17.414l-4.707-4.707c-0.391-0.391-0.391-1.023,0-1.414L14,6.586L15.414,8l-4,4l4,4L14,17.414z' />,
    'carret',
);

const SpinnerSprite = spritesheet.sprite(
    <circle cx='50' cy='50' r='45' />,
    'circle',
);

spritesheet.collect();

export const carretUrl = CarretSprite.url();
export const spinnerUrl = SpinnerSprite.url();
