import * as page from "../../dep/frugal/page.ts";
import { getRenderFrom } from "../../dep/frugal/preact.server.ts";
import { Page } from "./Page.tsx";

export const pattern = "/";

console.log(getRenderFrom.toString());
console.log(Page.toString());

export const render = getRenderFrom(Page);

export function renderOld(context: page.RenderContext<typeof pattern>) {
  return `<html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="${
    context.assets["style"][context.descriptor]
  }" />
    </head>
    <body>
        <svg xmlns="http://www.w3.org/2000/svg" class="symbols">
            <symbol fill="currentColor" id="icon-caret-down" viewBox="0 0 256 256">
                <path d="M128,188a11.96187,11.96187,0,0,1-8.48535-3.51465l-80-80a12.0001,12.0001,0,0,1,16.9707-16.9707L128,159.0293l71.51465-71.51465a12.0001,12.0001,0,0,1,16.9707,16.9707l-80,80A11.96187,11.96187,0,0,1,128,188Z"/>
            </symbol>
            <symbol fill="currentColor" id="icon-caret-left" viewBox="0 0 256 256">
                <use href="#icon-caret-down" transform="rotate(90, 128, 128)" />
            </symbol>
            <symbol fill="currentColor" id="icon-caret-right" viewBox="0 0 256 256">
                <use href="#icon-caret-down" transform="rotate(-90, 128, 128)" />
            </symbol>
        </svg>

        <nav class="main-nav" aria-label="Main Menu">
            <img class="logo" src="https://placeholder.pics/svg/200x100/DEDEDE/000/logo" />

            <ul class="nav-list inpage">
                <li>
                    <a href="#">About</a>
                </li>
                <li>
                    <a href="#">Team</a>
                </li>
                <li>
                    <a href="#">Upcoming Events</a>
                </li>
            </ul>

            <ul class="nav-list global">
                <li>
                    <a href="#">All Events</a>
                </li>
            </ul>

        </nav>

        <header class="hero">
            <div class="navigation previous">
                <button class="navigate" previous aria-label="previous">
                    <svg viewBox="0 0 256 256" class="icon caret-left">
                        <use href="#icon-caret-left" />
                    </svg>
                </button>
            </div>
            <div class="navigation next">
                <button class="navigate" next aria-label="next">
                    <svg viewBox="0 0 256 256" class="icon caret-right">
                        <use href="#icon-caret-right" />
                    </svg>
                </button>
            </div>

            <div class="slide" active>
                <div class="slide-content">
                    <h1>Workshop</h1>
                    <date>17 Septembreber 2078</date>
                    <h2>When and how to branle, a retrospective on branling as a science</h2>
                    <a href="#">Register</a>
                </div>
                <div class="overlay"></div>
                <div class="background" style="background-image:url('https://picsum.photos/2000/1000#1');"></div>
            </div>
            <div class="slide">
                <div class="slide-content">
                    <h1>Conference</h1>
                    <date>12 March 2032</date>
                    <h2>Not to brag, but i fucked your mom last night</h2>
                    <a href="#">Register</a>
                </div>
                <div class="overlay"></div>
                <div class="background" style="background-image:url('https://picsum.photos/2000/1000#2');"></div>
            </div>
            <div class="slide">
                <div class="slide-content">
                    <h1>Meetup</h1>
                    <date>31 Februarury 2065</date>
                    <h2>Let's meet and drink piss together</h2>
                    <a href="#">Register</a>
                </div>
                <div class="overlay"></div>
                <div class="background" style="background-image:url('https://picsum.photos/2000/1000#3');"></div>
            </div>
        </header>
        
        <main>

        </main>

        <script src="./main.js"></script>
    </body>
</html>`;
}
