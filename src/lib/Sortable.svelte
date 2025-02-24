<!-- 
<script module>
  let testI = 0;

  function swap(target: number, destination: number, after: boolean, array: number[]) {
    const out = array.slice();
    // console.log(out);
    if (target === destination) return out;

    const item = out.splice(target, 1)[0];

    if (target < destination) {
      destination -= 1;
    }

    if (after) {
      destination += 1;
    }

    // console.log(item);

    out.splice(destination, 0, item);
    // console.log(out);
    return out;
  }
  console.clear();

  function test(from: number, index: number, before: boolean, array: number[]) {
    console.group(testI++);
    const newArray = swap(from, index, !before, array);

    const sorted = array.toSorted();
    const passed = newArray.every((v, i) => v === sorted[i]);

    if (!passed) {
      console.warn('failed', testI);
    } else {
      console.log('passed', testI);
    }
    console.groupEnd();
  }

  {
    // console.clear();
    test(0, 2, true, [1, 0, 2]);
    test(0, 1, false, [1, 0, 2]);
    test(0, 0, false, [0, 1, 2]);
    test(0, 0, true, [0, 1, 2]);
    test(1, 1, false, [0, 1, 2]);
    test(1, 1, true, [0, 1, 2]);
    test(2, 2, false, [0, 1, 2]);
    test(2, 2, true, [0, 1, 2]);
    test(1, 3, false, [0, 3, 1, 2]);
    test(2, 3, false, [0, 1, 3, 2]);
    test(2, 3, false, [0, 1, 3, 2]);
    test(0, 1, true, [0, 1, 2, 3]);
    test(0, 1, false, [1, 0, 2, 3]);
    test(1, 0, true, [1, 0, 2, 3]);
    test(1, 0, false, [0, 1, 2, 3]);
    test(1, 3, true, [0, 2, 1, 3]);
    test(3, 0, false, [0, 2, 3, 1]);
    test(3, 1, true, [0, 2, 3, 1]);
    test(1, 3, false, [0, 3, 1, 2]);
    test(3, 0, true, [1, 2, 3, 0]);
    // // Using an original array of 5 elements: [0,1,2,3,4]
    test(4, 1, false, [0, 1, 3, 4, 2]);
    test(4, 2, true, [0, 1, 3, 4, 2]);
    test(1, 4, false, [0, 4, 1, 2, 3]);
    test(4, 1, false, [0, 1, 4, 2, 3]);
    test(1, 4, true, [0, 2, 3, 1, 4]);
    test(1, 4, false, [0, 2, 3, 4, 1]);
    test(3, 0, true, [3, 0, 1, 2, 4]);
    test(3, 0, false, [0, 3, 1, 2, 4]);
    test(0, 2, true, [1, 0, 2, 3, 4]);
    test(0, 2, false, [1, 2, 0, 3, 4]);
    // // Using an original array of 6 elements: [0,1,2,3,4,5]
    // test(0, 5, true, [1, 2, 3, 4, 0, 5]);
    // test(0, 5, false, [1, 2, 3, 4, 5, 0]);
    // test(5, 0, true, [5, 0, 1, 2, 3, 4]);
    // test(5, 0, false, [0, 5, 1, 2, 3, 4]);
    // test(2, 2, true, [0, 1, 2, 3, 4, 5]);
    // test(2, 2, false, [0, 1, 3, 2, 4, 5]);
    // test(3, 3, true, [0, 1, 2, 3, 4, 5]);
    // test(3, 3, false, [0, 1, 2, 4, 3, 5]);
    // test(4, 2, true, [0, 1, 4, 2, 3, 5]);
    // test(4, 2, false, [0, 1, 2, 4, 3, 5]);
    // test(1, 4, true, [0, 2, 3, 1, 4, 5]);
    // test(4, 0, false, [0, 2, 3, 4, 1, 5]);
    // test(4, 5, true, [0, 1, 2, 3, 4, 5]);
    // test(4, 5, false, [0, 1, 2, 3, 5, 4]);
  }
</script> -->

<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { flip } from "svelte/animate";

  type Props = {
    array: T[];
    map: Snippet<[T, number, T[]]>;
    direction?: "horizontal" | "vertical";
  };

  let { array = $bindable(), map, direction = "vertical" }: Props = $props();

  let from = $state<undefined | number>();
  let target = $state<{ index: number; before: boolean } | undefined>();

  function swap(target: number, destination: number, after: boolean, array: T[]) {
    const out = array.slice();
    if (target === destination) return out;

    const item = out.splice(target, 1)[0];

    if (target < destination) {
      destination -= 1;
    }

    if (after) {
      destination += 1;
    }

    out.splice(destination, 0, item);
    return out;
  }
</script>

<div
  class="sortable-list"
  class:dragging={from !== undefined}
  class:horizontal={direction === "horizontal"}
  class:vertical={direction === "vertical"}
>
  {#each array as item, index (item)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="item"
      draggable="true"
      ondragstart={() => (from = index)}
      ondragend={() => {
        from = undefined;
        target = undefined;
      }}
      animate:flip={{ duration: 300 }}
    >
      {@render map(item, index, array)}
      {@render DropHandle(index, true)}
      {@render DropHandle(index, false)}
    </div>
  {/each}
</div>

{#snippet DropHandle(index: number, before: boolean)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drop-handle"
    class:dragging-over={target?.index === index &&
      target?.before === before &&
      from !== index &&
      from !== index + (before ? -1 : 1)}
    class:before
    class:after={!before}
    ondragover={(e) => {
      e.preventDefault();
      target = { index, before };
    }}
    ondragenter={(e) => e.preventDefault()}
    ondrop={() => {
      if (from === undefined) return;
      array = swap(from, index, !before, array);
    }}
  ></div>
{/snippet}

<style>
  .sortable-list {
    display: flex;
    flex-direction: column;
    &.horizontal {
      flex-direction: row;
    }
  }

  .item {
    cursor: pointer;
    position: relative;
  }

  .drop-handle {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 2px solid transparent;
    margin-top: -1px;
    --drop-target-border-color: cornflowerblue;
  }

  .dragging .drop-handle {
    pointer-events: all;
  }

  .vertical .drop-handle.after {
    top: 50%;
    &.dragging-over {
      border-bottom-color: var(--drop-target-border-color);
    }
  }
  .vertical .drop-handle.before {
    bottom: 50%;
    &.dragging-over {
      border-top-color: var(--drop-target-border-color);
    }
  }

  .horizontal .drop-handle.after {
    left: 50%;
    &.dragging-over {
      border-right-color: var(--drop-target-border-color);
    }
  }
  .horizontal .drop-handle.before {
    right: 50%;
    &.dragging-over {
      border-left-color: var(--drop-target-border-color);
    }
  }
</style>
