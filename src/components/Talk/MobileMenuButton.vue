<template>
  <QBtn flat round dense>
    <QIcon name="menu" />
    <QMenu transition-show="none" transition-hide="none">
      <QList dense>
        <MenuItem
          v-for="(item, index) in menudata"
          :key="item.label"
          v-model:selected="subMenuOpenFlags[index]"
          :menudata="item"
        />
      </QList>
    </QMenu>
  </QBtn>
  <QSeparator vertical spaced inset color="background" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import MenuItem from "@/components/Menu/MenuItem.vue";
import { MenuItemData } from "@/components/Menu/type";

const menudata = ref<MenuItemData[]>([
  {
    type: "button",
    label: "選択している音声を書き出し",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
  {
    type: "button",
    label: "すべての音声を書き出し",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
  {
    type: "button",
    label: "すべての音声を繋げて書き出し",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
  {
    type: "separator",
  },
  {
    type: "button",
    label: "テキストを繋げて書き出し",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
  {
    type: "button",
    label: "テキスト読み込み",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
  {
    type: "separator",
  },
  {
    type: "button",
    label: "メニューに戻る",
    onClick: () => {
      alert("TODO");
    },
    disableWhenUiLocked: true,
  },
]);

const subMenuOpenFlags = ref<boolean[]>(
  [...Array(menudata.value.length)].map(() => false)
);
</script>
