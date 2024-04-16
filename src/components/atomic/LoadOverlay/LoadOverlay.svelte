<script lang="ts">
  export let isLoading = false;
</script>

<div class:isLoading></div>

<style>
  div {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    overflow: hidden;
    z-index:-1
  }
  .isLoading {
    z-index: 1;
  }
  .isLoading::after {
    position: absolute;
    content: "";
    left: -150%;
    height: 120%;
    width: 75%;
    bottom: 0;
    transform: skewX(-20deg);
    opacity: var(--opacity, 0.2);
    background-color: hsl(0deg, 0%, 100%);
    box-shadow: 0 0 10px 10px hsla(0deg, 0%, 100%, 20%);
    animation: swoosh 2s infinite;
  }
  @keyframes swoosh {
    from {
      left: -150%;
    }
    to {
      left: 150%;
    }
  }
</style>
