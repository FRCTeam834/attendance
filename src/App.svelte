<script>
  let canvas;
  let ctx;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // make the canvas
  const initCanvas = () => {
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";  // Black color
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;  // Stroke width
  };

  // Get mouse or touch position relative to the canvas
  const getPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    // For touch events
    if (e.touches) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.offsetX;
      y = e.offsetY;
    }

    return { x, y };
  };

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault();  // Prevent default behavior like scrolling on touch devices
    isDrawing = true;

    const { x, y } = getPosition(e);
    [lastX, lastY] = [x, y];
  };

  // Draw the line
  const draw = (e) => {
    if (!isDrawing) return;

    const { x, y } = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    [lastX, lastY] = [x, y];
  };

  // Stop drawing
  const stopDrawing = () => {
    isDrawing = false;
  };

  // Clear the canvas
  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  import { onMount } from "svelte";
  onMount(initCanvas);
</script>

<style>
  .center-wrapper {
    text-align: center;
  }

  canvas {
    border: 1px solid #ccc;
    cursor: crosshair;
    margin-top: 20px;
  }

  .form-container {
    display: inline-block;
    text-align: center;
  }

  select, button {
    margin: 10px;
  }
</style>

<div class="center-wrapper">
  <form method="POST" class="form-container">
    <br> <br> <br> <br>

    <!-- Name Dropdown -->
    <select name="Name" class="select select-bordered w-full max-w-xs" required>
      <option value="Dominic">Dominic</option>
    </select>
    <br>

    <!-- sign in sign out buttons -->
    <button type="button" class="btn" >
    <button type="button" class="btn">

    <br> <br> <br> <!-- spacing -->

    <!-- Canvas for Drawing -->
    <canvas
      bind:this={canvas}
      width="400"
      height="300"
      on:mousedown={startDrawing}
      on:mousemove={draw}
      on:mouseup={stopDrawing}
      on:mouseleave={stopDrawing}
      on:touchstart={startDrawing}
      on:touchmove={draw}
      on:touchend={stopDrawing}
      on:touchcancel={stopDrawing}
    ></canvas>
    <br>
    <!-- Clear Button -->
    <button type="button" class="btn" on:click={clearCanvas}>Clear</button>
     <button class="btn">submit</button>
  </form>
</div>
