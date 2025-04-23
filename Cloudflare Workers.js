addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

/** 配置项：根据实际情况修改 */
const OWNER        = 'monbed'
const REPO         = 'wife'
const BRANCH       = 'main'
// 访问私有仓库需 repo Scope，公共仓库建议 public_repo
const GITHUB_TOKEN = ''

/**
 * 主请求处理函数
 * @param {FetchEvent} event
 */
async function handleRequest(event) {
  const request = event.request
  const url     = new URL(request.url)
  const path    = url.pathname.replace(/^\//, '')

  // —— 根路径 / 或列表接口 /list ——  
  if (path === 'list' || !path) {
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
    const resp   = await fetch(apiUrl, {
      headers: {
        'Accept':        'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko'
      }
    })
    if (!resp.ok) {
      const err = await resp.text()
      return new Response(
        `列表获取失败: ${resp.status} ${resp.statusText}\n${err}`,
        { status: 502, headers: {'Content-Type':'text/plain; charset=utf-8'} }
      )
    }
    const { tree } = await resp.json()
    const names = tree
      .filter(e => e.type === 'blob')
      .filter(e => e.path.startsWith('img1/') || e.path.startsWith('img2/'))
      .map(e => e.path.replace(/^img[12]\//, ''))
    return new Response(names.join('\n'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  // —— 图片代理 /{filename} ——  
  const cache    = caches.default
  const cacheKey = new Request(request.url, request)
  let response   = await cache.match(cacheKey)
  if (response) return response

  // 缓存未命中：依次尝试 img1/ 和 img2/ 目录
  const raw1 = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/img1/${path}`
  const raw2 = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/img2/${path}`
  response = await fetch(raw1)
  if (!response.ok) response = await fetch(raw2)
  if (!response.ok) {
    return new Response('未找到该图片', { status: 404 })
  }

  // 将响应克隆以便缓存，并设置缓存 86400 秒（1 天）
  const cached = new Response(response.body, response)
  cached.headers.set('Cache-Control', 's-maxage=86400')
  event.waitUntil(cache.put(cacheKey, cached.clone()))

  return cached
}
