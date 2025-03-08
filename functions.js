gsap.registerPlugin(Draggable, InertiaPlugin);

Draggable.create(".navigation-link", {
  type: "x,y",
  bounds: ".container",
  inertia: true,
});
