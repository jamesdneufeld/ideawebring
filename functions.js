gsap.registerPlugin(Draggable);

Draggable.create(".navigation-link", {
  type: "x,y",
  bounds: ".container",
  inertia: true,
});
