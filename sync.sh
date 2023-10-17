#!/bin/bash

glib-compile-schemas zoegraph@ext.mislah.com/schemas/
rsync -av --delete zoegraph@ext.mislah.com/ ~/.local/share/gnome-shell/extensions/zoegraph@ext.mislah.com