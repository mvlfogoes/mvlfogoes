await page.set_viewport_size({"width": 390, "height": 844})
CID = "46ce9d65-e689-4609-bc99-0d76ea8e3632"
errs = []
page.on("pageerror", lambda e: errs.append(str(e)))
try:
    await page.wait_for_timeout(2500)
    await page.click('[data-testid="mnav-whatsapp-button"]')
    await page.wait_for_selector(f'[data-testid="wa-cli-{CID}"]', timeout=8000)
    await page.locator(f'[data-testid="wa-cli-{CID}"]').evaluate("e => e.click()")
    await page.wait_for_selector('[data-testid="wa-sheet-orcamento"]', timeout=5000)
    await page.locator('[data-testid="wa-sheet-orcamento"]').evaluate("e => e.click()")
    await page.wait_for_selector('[data-testid="flyer-canvas"]', timeout=5000)
    print("title:", await page.inner_text('[data-testid="flyer-modal-title"]'))
    n = await page.locator('[data-testid^="flyer-item-desc-"]').count()
    print("initial items", n)
    while await page.locator('[data-testid="flyer-item-add"]').count() > 0:
        await page.locator('[data-testid="flyer-item-add"]').evaluate("e => e.click()")
        await page.wait_for_timeout(150)
    n = await page.locator('[data-testid^="flyer-item-desc-"]').count()
    print("items after add-until-hidden:", n, "add visible:", await page.locator('[data-testid="flyer-item-add"]').count())
    vals = ["R$ 120,00", "45", "1.250", "10,5", "R$ 99,90"]
    for i in range(n):
        if not await page.input_value(f'[data-testid="flyer-item-desc-{i}"]'):
            await page.fill(f'[data-testid="flyer-item-desc-{i}"]', f"Item teste numero {i+1} com descricao")
        await page.fill(f'[data-testid="flyer-item-valor-{i}"]', vals[i])
    await page.fill('[data-testid="flyer-input-outros"]', "Mangueira de gás R$ 35,00\nRegulador R$ 1.200\nlinha três de texto\nlinha quatro deveria cortar")
    out = await page.input_value('[data-testid="flyer-input-outros"]')
    print("outros lines:", len(out.split("\n")), repr(out))
    print("total:", await page.inner_text('[data-testid="flyer-total"]'))
    geo = await page.evaluate("""() => {
      const c=document.querySelector('[data-testid=flyer-canvas]'); const foot=c.lastElementChild.getBoundingClientRect();
      const r=s=>{const e=document.querySelector(s); const b=e.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom)}};
      const ta=document.querySelector('[data-testid=flyer-input-outros]');
      return {footTop:Math.round(foot.top), total:r('[data-testid=flyer-total]'), val:r('[data-testid=flyer-input-validade]'), pag:r('[data-testid=flyer-input-pagamento]'), outrosScroll:ta.scrollHeight, outrosClient:ta.clientHeight}
    }""")
    print("geo:", geo)
    print("pag above footer:", geo['pag']['bottom'] <= geo['footTop'], "val above:", geo['val']['bottom'] <= geo['footTop'])
    await page.locator('[data-testid="flyer-canvas"]').scroll_into_view_if_needed()
    await page.screenshot(path=".screenshots/orc_live.jpg", quality=40, full_page=False)
    async with page.expect_download() as dl:
        await page.locator('[data-testid="flyer-download-btn"]').evaluate("e => e.click()")
    d = await dl.value
    await d.save_as("/tmp/orc.png")
    print("downloaded", d.suggested_filename)
    await page.wait_for_timeout(800)
    await page.evaluate("() => { window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return null}; navigator.canShare = undefined; }")
    async with page.expect_download() as dl2:
        await page.locator('[data-testid="flyer-send-btn"]').evaluate("e => e.click()")
    await dl2.value
    await page.wait_for_timeout(1500)
    op = await page.evaluate("() => window.__opened")
    from urllib.parse import unquote
    for u in op: print("WA:", unquote(u))
except Exception as e:
    print("ERR", e)
print("pageerrors", errs)
