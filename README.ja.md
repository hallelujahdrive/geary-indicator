![build workflow](https://github.com/hallelujahdrive/geary-indicator/actions/workflows/build.yml/badge.svg)

[![en](https://img.shields.io/badge/lang-en-red.svg)](./README.md)

# GNOME Shell Extension: Geary Indicator

Geary Indicator は Gearyのメール受信が確認できるアイコンをトレイに追加します。また、いくつかの操作ができるポップアップメニューも提供します。

## Features

- トレイにGearyのメール受信が確認できるアイコンを追加
- ポップアップメニューを提供

## Installation

### GNOME Extensions Websiteからインストール
準備中

### 手動インストール

1. リポジトリをクローンするか、ダウンロードする:
   ```bash
   git clone https://github.com/hallelujahdrive/geary-indicator.git
   ```
1. 拡張機能のディレクトリに移動:
   ```bash
   cd geary-indicator
   ```
1. ビルドしてインストール:
   ```bash
   make all
   make install
   ```
1. GNOME Shellを再起動 (Alt + F2を入力後, rを入力してEnterを押下)。

## Usage

この拡張機能は[Geary](https://wiki.gnome.org/Apps/Geary)専用です。