// Formats staged files on commit, backing up the format-on-edit agent hook (agent toolset).
export default {
  '*': 'prettier --write --ignore-unknown',
}
