/**
 * wiki.js
 * ------------------------------------------------------------
 * 役職事典ページ(wiki.html)の表示ロジック。
 * データは js/wiki-data.js の window.ONW_WIKI_ROLES を使う。
 * 元データ(アドオンの state.js)から機械的に転記したものなので、
 * ここでは表示・検索・絞り込み・並び替えだけを行い、内容の書き換えはしない。
 * ------------------------------------------------------------
 */
(function () {
  const roles = window.ONW_WIKI_ROLES || [];

  const TEAM_LABEL = {
    village: "村人陣営",
    wolf: "人狼陣営",
    third: "第三陣営",
  };

  const SORT_LABEL = {
    kana: "五十音順",
    impl: "ゲーム内順",
  };

  // ゲーム内順での大分類: 村人 → 人狼 → 狂人 → 第三陣営。
  // (「陣営なし」は廃止。ドッペルゲンガーは第三陣営として扱う)
  // team="wolf" の中で「人狼」と「狂人」をさらに分けるための一覧
  // (アドオン utils.js の isRealWolfRole / isMadRole と同じ内訳)。
  const REAL_WOLF_KEYS = new Set([
    "WEREWOLF", "BIG_WOLF", "LONE_WOLF", "WHITE_WOLF", "TOFU_WOLF", "NEGI_WOLF", "FORGETFUL_WOLF",
    "ASSASSIN", "WOLF_KING", "MAPO_WOLF", "CAT_PUMPKIN", "OBSERVER_WOLF", "MIND_WOLF", "MIMIC_WOLF",
    "ERASER_WOLF", "MIRAGE_WOLF", "SILVER_WOLF", "COMMAND_WOLF", "CURSE_WOLF", "SAM", "PATCH",
  ]);
  const MAD_KEYS = new Set([
    "MADMAN", "MAD_SEER", "CULTIST", "BLACK_CAT", "CRAZY_DONUT_SHOP", "EXPOSED_MADMAN", "MUZZLE_MADMAN",
    "REBEL_MADMAN", "MAD_QUEEN", "BLACK_WOLF_MADMAN", "MAD_MAYOR", "SEAL_MADMAN", "RAT_MADMAN", "OX_MADMAN",
    "TIGER_MADMAN", "RABBIT_MADMAN", "DRAGON_MADMAN", "SNAKE_MADMAN", "HORSE_MADMAN", "SHEEP_MADMAN",
    "MONKEY_MADMAN", "ROOSTER_MADMAN", "DOG_MADMAN", "BOAR_MADMAN", "MAD_EXCHANGER", "TENACIOUS_MADMAN",
    "JESTER_MADMAN", "SMOKE_MADMAN", "MAD_PRIEST", "MAD_AGITATOR",
  ]);

  function implCategoryOf(role) {
    if (role.team === "village") return 0;
    if (role.team === "wolf") return MAD_KEYS.has(role.key) ? 2 : 1; // 1:人狼 2:狂人
    return 3; // third（ドッペルゲンガーもここに含まれる）
  }

  // --- 絞り込み方（team とは別軸の「候補」系フィルター）------------------
  // 元アドオン(scripts/night.js, scripts/state.js)のロジックから機械的に転記した
  // 候補一覧。ここでの判定は本文の推測ではなく、実際のコードが参照している
  // 一覧そのもの（shufflerEligibleRoles / mimicWolfCandidateRoles+NON_MIMICABLE_ROLES
  // / cosplayerEligibleRoles）に基づく。
  const SHUFFLE_CANDIDATE_KEYS = new Set([
    "WEREWOLF", "BIG_WOLF", "LONE_WOLF", "WHITE_WOLF", "TOFU_WOLF", "NEGI_WOLF", "FORGETFUL_WOLF",
    "MADMAN", "BLACK_CAT", "VILLAGER", "HAYATOCHIRI", "BELL_MIKO", "WHIMSICAL_SEER", "INSOMNIAC",
    "TANNER", "STRAW_DOLL", "CAT_SIDHE", "WOLF_DREAMER", "WOLF_MARKED", "GOD", "OPPORTUNIST",
    "AMANOJAKU", "BAKER", "DONUT_SHOP", "CRAZY_DONUT_SHOP", "STAR", "SERVANT", "CHICKEN",
    "NEWSPAPER", "NECROMANCER", "WRAITH", "WINNER", "LOSER", "SCHRODINGER_CAT", "MAYOR",
    "EXECUTIONER", "WOLF_KING", "QUEEN", "TOUGH_GUY", "BOUNTY_HUNTER", "FOX", "FANATIC",
    "FOX_MARKED", "KEYMASTER", "MUZZLE_MADMAN", "DICTATOR", "REBEL_MADMAN", "EXCHANGER",
    "MAD_EXCHANGER", "MAD_QUEEN", "BLACK_WOLF_MADMAN", "MAD_MAYOR", "SEAL_MADMAN", "RAT_MADMAN",
    "OX_MADMAN", "TIGER_MADMAN", "SNAKE_MADMAN", "HORSE_MADMAN", "SHEEP_MADMAN", "MONKEY_MADMAN",
    "ROOSTER_MADMAN", "BOAR_MADMAN", "MAPO_WOLF", "PENGUIN", "WATCHDOG", "SHERIFF", "BALANCER",
    "CURSED_ONE", "THIEF", "CAT_PUMPKIN", "OBSERVER_WOLF", "JESTER_BOMBER", "DETECTIVE",
    "SENSE_SEER", "PRINCESS", "FINGER_READER", "GAMBLER", "FAIRY", "AA", "GORANSHIN", "STEVE",
    "DEMON_DUKE", "MARTYR", "ODD_ONE", "EVEN_ONE", "DETECTIVE_GHOST", "LIBRA", "PREDICTOR",
    "LAWYER", "TENACIOUS_MADMAN", "JESTER_MADMAN", "MIND_WOLF", "POET", "SERIAL_KILLER",
    "PROFILER", "VANITY", "MULTI_PERSONALITY", "BEGGAR", "MAGICAL_GIRL", "YOKAI_TANUKI",
    "SMOKE_MADMAN", "SILVER_WOLF", "CURSE_WOLF", "ICARUS", "ELECTION_MANAGER", "MOSES", "REN",
    "LONG_NIGHT_MOON", "MITSUKI_NANOKA", "RASETSU", "YOMI", "KNIGHT", "HOKMA", "PSYCHOLOGIST",
    "MEDIUM", "AGENT", "HOTARU", "THREAD_SPINNER", "PERSONA", "HUNTER", "COUNSELOR",
  ]);

  const MIMIC_CANDIDATE_KEYS = new Set([
    "BIG_WOLF", "LONE_WOLF", "WHITE_WOLF", "TOFU_WOLF", "NEGI_WOLF", "FORGETFUL_WOLF", "ASSASSIN",
    "MAD_SEER", "BLACK_CAT", "SEER", "APPRENTICE_SEER", "LOOKOUT", "BELL_MIKO", "WHIMSICAL_SEER",
    "ROBBER", "RELIC_ROBBER", "TROUBLEMAKER", "INSOMNIAC", "MASON", "STRAW_DOLL", "CAT_SIDHE",
    "MERLIN", "WOLF_DREAMER", "BAKER", "DONUT_SHOP", "CRAZY_DONUT_SHOP", "STAR", "CHICKEN",
    "NEWSPAPER", "NECROMANCER", "MAYOR", "VISITOR", "WOLF_KING", "EXPOSED_MADMAN", "QUEEN",
    "TOUGH_GUY", "KEYMASTER", "MUZZLE_MADMAN", "DICTATOR", "REBEL_MADMAN", "EXCHANGER",
    "MAD_EXCHANGER", "MAD_QUEEN", "MAD_MAYOR", "SEAL_MADMAN", "RAT_MADMAN", "OX_MADMAN",
    "TIGER_MADMAN", "RABBIT_MADMAN", "DRAGON_MADMAN", "SNAKE_MADMAN", "HORSE_MADMAN",
    "SHEEP_MADMAN", "MONKEY_MADMAN", "ROOSTER_MADMAN", "DOG_MADMAN", "BOAR_MADMAN", "MAPO_WOLF",
    "PENGUIN", "WATCHDOG", "SHERIFF", "THIEF", "CAT_PUMPKIN", "OBSERVER_WOLF", "SENSE_SEER",
    "MAJOR", "FINGER_READER", "GAMBLER", "FAIRY", "AA", "GORANSHIN", "STEVE", "LIBRA", "FAKE_SEER",
    "TENACIOUS_MADMAN", "MIND_WOLF", "POET", "PROFILER", "COSPLAYER", "SMOKE_MADMAN",
    "ERASER_WOLF", "MIRAGE_WOLF", "SILVER_WOLF", "COMMAND_WOLF", "CURSE_WOLF", "ICARUS",
    "ELECTION_MANAGER", "MOSES", "REN", "AGITATOR", "MAD_AGITATOR", "YOMI", "TRAILBLAZER",
    "HOKMA", "BARTENDER", "PSYCHOLOGIST", "MEDIUM", "SAM", "PATCH", "HUNTER", "COUNSELOR",
    "TRAP_MASTER",
  ]);

  const COSPLAY_CANDIDATE_KEYS = new Set([
    "SEER", "APPRENTICE_SEER", "LOOKOUT", "BELL_MIKO", "WHIMSICAL_SEER", "ROBBER", "RELIC_ROBBER",
    "TROUBLEMAKER", "INSOMNIAC", "BAKER", "DONUT_SHOP", "AGITATOR", "STAR", "NEWSPAPER", "MAYOR",
    "VISITOR", "QUEEN", "TOUGH_GUY", "DICTATOR", "EXCHANGER", "PENGUIN", "WATCHDOG", "SHERIFF",
    "THIEF", "SENSE_SEER", "PRINCESS", "MAJOR", "FINGER_READER", "GAMBLER", "FAIRY", "LIBRA",
    "FAKE_SEER", "POET", "AA", "GORANSHIN", "STEVE", "ICARUS", "ELECTION_MANAGER", "MOSES", "YOMI",
    "CARMEN", "KNIGHT", "TRAILBLAZER", "HOKMA", "PSYCHOLOGIST", "MEDIUM", "HAYATOCHIRI",
    "NECROMANCER", "COUNSELOR", "REN", "TRAP_MASTER",
  ]);

  function isShuffleCandidate(role) { return SHUFFLE_CANDIDATE_KEYS.has(role.key); }
  function isMimicCandidate(role) { return MIMIC_CANDIDATE_KEYS.has(role.key); }
  function isCosplayCandidate(role) { return COSPLAY_CANDIDATE_KEYS.has(role.key); }

  const FILTER_DEFS = [
    { id: "all", label: "すべて", test: () => true },
    { id: "village", label: TEAM_LABEL.village, test: (r) => r.team === "village" },
    { id: "wolf", label: TEAM_LABEL.wolf, test: (r) => r.team === "wolf" },
    { id: "third", label: TEAM_LABEL.third, test: (r) => r.team === "third" },
    { id: "shuffle", label: "シャッフル候補", test: isShuffleCandidate },
    { id: "mimic", label: "模倣候補", test: isMimicCandidate },
    { id: "cosplay", label: "コスプレ候補", test: isCosplayCandidate },
  ];
  const FILTER_BY_ID = Object.fromEntries(FILTER_DEFS.map((f) => [f.id, f]));

  const state = {
    query: "",
    filter: "all",
    sort: "kana",
    controlsOpen: false,
  };

  // 「五十音順」= wiki-data.js の元々の並び順(配列インデックス)。
  // 「ゲーム内順」= アドオンのROLE_ORDER(役職選択画面の並び)を示すorderフィールド。
  const kanaIndexByKey = {};
  roles.forEach((r, i) => { kanaIndexByKey[r.key] = i; });

  const $list = document.getElementById("wiki-list");
  const $empty = document.getElementById("empty-state");
  const $count = document.getElementById("role-count");
  const $filters = document.getElementById("team-filters");
  const $sortToggle = document.getElementById("sort-toggle");
  const $search = document.getElementById("search-input");
  const $controlsToggle = document.getElementById("controls-toggle");
  const $controlsPanel = document.getElementById("controls-panel");

  function buildFilters() {
    $filters.innerHTML = FILTER_DEFS
      .filter((f) => f.id === "all" || roles.some((r) => f.test(r)))
      .map((f) => `<button class="wiki-filter ${f.id === state.filter ? "active" : ""}" data-filter="${f.id}">${f.label}</button>`)
      .join("");

    $filters.querySelectorAll(".wiki-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        buildFilters();
        render();
      });
    });
  }

  function buildControlsToggle() {
    if (!$controlsToggle || !$controlsPanel) return;
    $controlsToggle.setAttribute("aria-expanded", String(state.controlsOpen));
    $controlsToggle.textContent = `並び替え・絞り込み ${state.controlsOpen ? "▲" : "▼"}`;
    $controlsPanel.hidden = !state.controlsOpen;
  }

  function buildSortToggle() {
    const modes = ["kana", "impl"];
    $sortToggle.innerHTML = modes
      .map((m) => `<button class="wiki-filter ${m === state.sort ? "active" : ""}" data-sort="${m}">${SORT_LABEL[m]}</button>`)
      .join("");

    $sortToggle.querySelectorAll(".wiki-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sort = btn.dataset.sort;
        buildSortToggle();
        render();
      });
    });
  }

  function matches(role) {
    const def = FILTER_BY_ID[state.filter] ?? FILTER_BY_ID.all;
    if (!def.test(role)) return false;
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return role.name.toLowerCase().includes(q) || role.desc.toLowerCase().includes(q);
  }

  function sortRoles(list) {
    const sorted = [...list];
    if (state.sort === "impl") {
      sorted.sort((a, b) => {
        const diff = implCategoryOf(a) - implCategoryOf(b);
        if (diff !== 0) return diff;
        return (a.order ?? 9999) - (b.order ?? 9999);
      });
    } else {
      sorted.sort((a, b) => kanaIndexByKey[a.key] - kanaIndexByKey[b.key]);
    }
    return sorted;
  }

  function render() {
    const filtered = sortRoles(roles.filter(matches));
    $count.textContent = `${filtered.length}件`;
    $empty.hidden = filtered.length !== 0;

    $list.innerHTML = filtered
      .map(
        (role) => `
        <article class="wiki-card" data-team="${role.team}">
          <div class="wiki-card__head">
            <span class="wiki-card__name">${escapeHtml(role.name)}</span>
            <span class="tag-team tag-team--${role.team}">${TEAM_LABEL[role.team] ?? role.team}</span>
          </div>
          <p class="wiki-card__desc">${escapeHtml(role.desc)}</p>
        </article>
      `
      )
      .join("");
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  $search.addEventListener("input", () => {
    state.query = $search.value.trim();
    render();
  });

  if ($controlsToggle) {
    $controlsToggle.addEventListener("click", () => {
      state.controlsOpen = !state.controlsOpen;
      buildControlsToggle();
    });
  }

  buildFilters();
  buildSortToggle();
  buildControlsToggle();
  render();
})();
