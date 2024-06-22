export const avatarTypes = {
  empty: undefined,
  transparentBg: "https://robohash.org/mr-robot",
  /** Abby avatar converted to base64 and pulled from [Dicebear.com](https://www.dicebear.com/playground/) which is a remix of:
   * Adventurer Neutral by Lisa Wischofsky, licensed under CC BY 4.0*/
  full: "data:image/jpg;base64,/9j/7QEgUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAQMcAgUAEkFkdmVudHVyZXIgTmV1dHJhbBwCUAAPTGlzYSBXaXNjaG9mc2t5HAJuAA9MaXNhIFdpc2Nob2Zza3kcAnQAuFJlbWl4IG9mIIRBZHZlbnR1cmVyIE5ldXRyYWyUIChodHRwczovL3d3dy5maWdtYS5jb20vY29tbXVuaXR5L2ZpbGUvMTE4NDU5NTE4NDEzNzg4MTc5NikgYnkghExpc2EgV2lzY2hvZnNreZQsIGxpY2Vuc2VkIHVuZGVyIIRDQyBCWSA0LjCUIChodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnkvNC4wLykcAgAAAgAEAP/hD4lodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nIHg6eG1wdGs9J0ltYWdlOjpFeGlmVG9vbCAxMi44NSc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzpjcmVhdG9yPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGk+TGlzYSBXaXNjaG9mc2t5PC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L2RjOmNyZWF0b3I+CiAgPGRjOnJpZ2h0cz4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPlJlbWl4IG9mIOKAnkFkdmVudHVyZXIgTmV1dHJhbOKAnSAoaHR0cHM6Ly93d3cuZmlnbWEuY29tL2NvbW11bml0eS9maWxlLzExODQ1OTUxODQxMzc4ODE3OTYpIGJ5IOKAnkxpc2EgV2lzY2hvZnNreeKAnSwgbGljZW5zZWQgdW5kZXIg4oCeQ0MgQlkgNC4w4oCdIChodHRwczovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnkvNC4wLyk8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6cmlnaHRzPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPkFkdmVudHVyZXIgTmV1dHJhbDwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6cGhvdG9zaG9wPSdodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvJz4KICA8cGhvdG9zaG9wOkNyZWRpdD5MaXNhIFdpc2Nob2Zza3k8L3Bob3Rvc2hvcDpDcmVkaXQ+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBsdXM9J2h0dHA6Ly9ucy51c2VwbHVzLm9yZy9sZGYveG1wLzEuMC8nPgogIDxwbHVzOkxpY2Vuc29yPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxwbHVzOkxpY2Vuc29yVVJMPmh0dHBzOi8vd3d3LmZpZ21hLmNvbS9jb21tdW5pdHkvZmlsZS8xMTg0NTk1MTg0MTM3ODgxNzk2PC9wbHVzOkxpY2Vuc29yVVJMPgogICAgPC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L3BsdXM6TGljZW5zb3I+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnhtcFJpZ2h0cz0naHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3JpZ2h0cy8nPgogIDx4bXBSaWdodHM6V2ViU3RhdGVtZW50Pmh0dHBzOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS80LjAvPC94bXBSaWdodHM6V2ViU3RhdGVtZW50PgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9J3cnPz7/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCACAAIADASIAAhEBAxEB/8QAHAABAAICAwEAAAAAAAAAAAAAAAYHAwgCBAUB/8QANhAAAQMEAAQDBgUEAgMAAAAAAQIDBAAFBhEHEiExE0FhCBQiMlFx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"
};

export type AvatarTypeKeys = keyof typeof avatarTypes;
