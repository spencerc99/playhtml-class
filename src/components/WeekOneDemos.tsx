// ABOUTME: Live week 1 demos built from real HTML + vanilla playhtml, run via
// ABOUTME: setupPlayElement and isolated so one broken demo can't break the page.

import { LiveHtmlDemo } from './LiveHtmlDemo';

const LAMP_GLOW =
  'brightness(1.2) saturate(1.6) drop-shadow(0px 0px 50px rgba(247, 220, 156, 0.85))';

const LAMP_SRC =
  'https://shop.noguchi.org/cdn/shop/products/1A_on_2048x.jpg?v=1567364979';

// Each demo is real HTML a student could paste, using can-toggle + a <style>.
// The id makes collaborative state sync; keep it unique per demo.
export function LampDemo() {
  return (
    <LiveHtmlDemo
      html={`
<style>
  #demo-lamp { width: 6rem; height: 6rem; object-fit: contain; cursor: pointer; filter: brightness(0.55); transition: filter 0.3s ease; }
  #demo-lamp.clicked { filter: ${LAMP_GLOW}; }
</style>
<img id="demo-lamp" class="week-demo__lamp" can-toggle src="${LAMP_SRC}" alt="Hanging lamp" />
`}
    />
  );
}

export function ColorToggleDemo() {
  return (
    <LiveHtmlDemo
      html={`
<style>
  #demo-color { background: #f3efe9; transition: background 0.3s ease; content: "off"; }
  #demo-color.clicked { background: #6cd97e; content: "on"; } 
  #demo-color::before { content: "off"; }
  #demo-color.clicked::before { content: "on"; }
</style>
<button id="demo-color" class="week-demo__box" type="button" can-toggle>
</button>
`}
    />
  );
}

export function CatOrDogToggleDemo() {
  return (
    <LiveHtmlDemo
      html={`
<style>
  #demo-cat-or-dog { width: 10rem; cursor: pointer; }
  #demo-cat-or-dog.clicked { content: url("/demo/dog.png"); }
</style>
<img id="demo-cat-or-dog" class="week-demo__cat-or-dog" can-toggle can-move src="/demo/cat.jpg" alt="Cat or dog" />
`}
    />
  );
}

export function ScaleToggleDemo() {
  return (
    <LiveHtmlDemo
      html={`
<style>
  #demo-scale { transform: scale(1); transition: transform 0.3s ease; }
  #demo-scale.clicked { transform: scale(2); }
</style>
<button id="demo-scale" class="week-demo__box week-demo__box--scale" type="button" can-toggle>▢</button>
`}
    />
  );
}
