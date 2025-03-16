<script lang="ts">
  import Icon from "./components/Icon.svelte";
  import { download_file, slugify, request_multi_file_upload, request_file_upload, random_id } from "./lib/utils";
  import { type TierList, templates } from "./lib/tierlist";
  import { blob_to_dataurl, blob_to_text, extract_image_segments } from "./lib/blob";
  import TierListEditor from "./components/TierListEditor.svelte";

  let tierlist = $state<TierList>(templates.empty());

  async function ask_load_template<T extends keyof typeof templates>(key: T) {
    const hasItems = tierlist.uncategorized.length > 0 || tierlist.tiers.map((x) => x.items.length).some((x) => x > 0);

    if (hasItems && !confirm("Loading this template will delete your current tier list. Are you sure?")) return;

    tierlist = await templates[key]();
  }

  let mode = $state<"mode-delete" | "mode-move">("mode-move");
</script>

<main class={mode}>
  <div class="tier-list-mode-buttons">
    <button
      title="Move mode"
      class="tier-list-mode-move"
      class:active={mode === "mode-move"}
      onclick={() => (mode = "mode-move")}
    >
      <Icon icon={"move"} />
    </button>
    <button
      title="Delete mode"
      class="tier-list-mode-delete"
      class:active={mode === "mode-delete"}
      onclick={() => (mode = "mode-delete")}
    >
      <Icon icon={"trash"} />
    </button>
    <button
      title="Upload a tier list"
      class="tier-list-upload"
      onclick={async () => {
        const file = await request_file_upload("application/json");
        if (file === null) return;
        tierlist = JSON.parse(await blob_to_text(file));
      }}
    >
      <Icon icon={"box-out"} width={20} height={20} />
    </button>
    <button
      title="Save tier list"
      class="tier-list-download"
      onclick={() => {
        download_file(slugify(tierlist.name) + ".json", JSON.stringify(tierlist, undefined, 2));
      }}
    >
      <Icon icon={"box-in"} width={20} height={20} />
    </button>
  </div>

  <TierListEditor bind:tierlist {mode} />

  <div class="information">
    <h3>Uploading an image</h3>
    <ul class="how-to-upload">
      <li><div>Paste an image from your clipboard.</div></li>
      <li><div>Drag an image from your desktop.</div></li>
      <li>
        <div>
          Select images to upload:
          <button
            title="Click to select files"
            style="display: inline; color: white;"
            onclick={async () => {
              let files = await request_multi_file_upload("image/*");
              if (files === null) return;
              for (const file of files) {
                tierlist.uncategorized.push({
                  id: random_id(),
                  src: await blob_to_dataurl(file),
                });
              }
            }}
          >
            <Icon icon={"box-out"} width={16} height={16} />
          </button>

          or upload a sprite sheet:
          <button
            title="Click to select files"
            style="display: inline; color: white;"
            onclick={async () => {
              let file = await request_file_upload("image/*");
              if (file === null) return;

              const blobs = await extract_image_segments(file);
              const dataUrls = await Promise.all(blobs.map(blob_to_dataurl));

              tierlist.uncategorized.push(
                ...dataUrls.map((url) => ({
                  id: random_id(),
                  src: url,
                }))
              );
            }}
          >
            <Icon icon={"box-out"} width={16} height={16} />
          </button>
        </div>
      </li>
    </ul>
    <h3>Templates</h3>
    <ul class="templates">
      <li><button onclick={() => ask_load_template("empty")}>Empty</button></li>
      <li><button onclick={() => ask_load_template("melee")}>Super Smash Bros. Melee</button></li>
      <li>
        <button onclick={() => ask_load_template("tabg_blessings")}>Totally Accurate Battlegrounds (Blessings)</button>
      </li>
      <li>
        <button onclick={() => ask_load_template("tabg_grenades")}>Totally Accurate Battlegrounds (Grenades)</button>
      </li>
      <li>
        <button onclick={() => ask_load_template("balatro")}>Balatro</button>
      </li>
    </ul>
  </div>
</main>

<style>
  main {
    margin: 5vmin auto;
    min-width: 95vmin;
    width: 70vw;
    max-width: 100vw;
    padding: 0 12px;
    /* perspective: 8000px; */
    flex-grow: 1;
    margin-bottom: 100vh;
  }

  .tier-list-meta-buttons {
    display: flex;
    margin-bottom: 8px;
  }

  .tier-list-mode-buttons {
    display: flex;
    padding: 0;

    .tier-list-mode-move,
    .tier-list-mode-delete,
    .tier-list-download,
    .tier-list-upload {
      border: 1px solid #666;
      color: #bbb;
      aspect-ratio: unset;
      border-radius: 4px;
      opacity: 0.5;
      height: 35px;
      aspect-ratio: 1;

      &.active {
        opacity: 0.75;
        color: #fff;
        background-color: #fff1;
        border-color: #888;
        z-index: 1;
      }

      &:hover {
        opacity: 1;
      }
    }

    .tier-list-mode-move {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      margin-right: -0.5px;
    }
    .tier-list-mode-delete {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      margin-left: -0.5px;
    }
    .tier-list-download,
    .tier-list-upload {
      margin-left: 0.4em;
    }
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.1em;
    font-size: 1.3em;
    line-height: 1;
    color: #fff3;

    &:hover {
      color: white;
    }

    &:disabled {
      pointer-events: none;
    }
  }

  .how-to-upload {
    li > div {
      display: flex;
      align-items: center;
      gap: 0.25em;
      flex-wrap: wrap;
    }
  }

  h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.2rem;
    padding-bottom: 0;
  }
  ul {
    margin-top: 0.2rem;
    padding-left: 1rem;
  }

  .information {
    max-width: 550px;
    margin: auto;
    margin-top: 3em;
    padding: 0 1rem;
  }

  .templates {
    list-style: disclosure-closed;
    button {
      font: inherit;
      color: inherit;

      margin: 0 -4px;
      padding: 0 4px;

      &:hover {
        outline: 1px solid cornflowerblue;
      }
    }
  }

  @media (700px >= width) {
    main {
      padding: 0;
      width: 100%;
      margin-top: 1rem;
    }

    .tier-list-mode-buttons {
      justify-content: center;
      margin-bottom: 0;
    }
  }
</style>
