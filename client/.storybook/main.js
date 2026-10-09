/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { autodocs: 'tag' },
};
