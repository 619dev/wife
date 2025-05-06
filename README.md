抽二次元老婆插件图床仓库

Cloudflare Workers部署图床参考Cloudflare Workers.js

## Cloudflare Workers部署

首页：https://workers.cloudflare.com

首先注册登陆，选择左侧`Compute (Workers)`，然后点击`Workers Pages`，`Start with Hello World!`。![1](https://github.com/user-attachments/assets/24abb9f1-2d75-4c6d-9d84-530b76366675)
取一个子域名（自己喜欢），点击`Deploy`。![2](https://github.com/user-attachments/assets/498751bd-c2ae-46ce-afab-9bbdc5925e17)
完成后点击Edit code，复制 [Cloudflare Workers.js](https://raw.githubusercontent.com/monbed/wife/refs/heads/main/Cloudflare%20Workers.js)  到左侧代码框
![image](https://github.com/user-attachments/assets/574e4c23-9f0b-4f38-8b23-e1adb9f6de35)

如果点错了可以在此处找到代码修改处：![image](https://github.com/user-attachments/assets/8c45c916-1f25-43a8-95ae-35ab9811b81b)


根据你的实际情况修改下列配置

const OWNER        = 'monbed'

const REPO         = 'wife'

const BRANCH       = 'main'

// 访问私有仓库需 repo Scope，公共仓库建议 public_repo
const GITHUB_TOKEN = '' 


GITHUB_TOKEN在这申请https://github.com/settings/tokens

最后点击`Deploy`。如果正常，右侧应显示首页。

在插件填入URL时，在结尾加上"/"，如https://113123.258369.workers.dev/


由于Cloudflare Workers被墙，请给bot可以正确访问的网络，或者其它可访问的方式（Google）。
