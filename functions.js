gsap.registerPlugin(Draggable, InertiaPlugin);

Draggable.create("#navigation-link", {
  type: "xy",
  bounds: document.getElementById("container"),
  inertia: true,
  onClick: function () {
    console.log("clicked");
  },
  onDragEnd: function () {
    console.log("drag ended");
  },
});
