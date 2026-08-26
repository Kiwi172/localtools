# localtools

Five single-purpose web tools that run entirely in your browser. No accounts, no
uploads, no servers, no build step, no dependencies.

| Tool | Does | Takes |
|---|---|---|
| [scrub](scrub/) | Shows the GPS coordinates, camera serial, and timestamp hidden in a photo, removes them, and permanently burns out regions you paint over | an image |
| [qr](qr/) | Builds QR codes for links, WiFi logins, contact cards, and crypto payment requests; exports SVG and PNG | text |
| [regex](regex/) | Live pattern testing with named groups, plus a plain-English explanation generated from the pattern itself | a pattern |
| [cron](cron/) | Turns five cryptic fields into a sentence and the next twelve times the job will actually run | a cron line |
| [gpx](gpx/) | Route map, elevation profile, and a radius cut off the start and finish so a track no longer points at your house | a `.gpx` file |

## The claim, and how it is checked

Every page loads `shared/site.js` before anything else. It patches `fetch`,
`XMLHttpRequest`, `sendBeacon`, and `WebSocket`, and registers a
`PerformanceObserver` for subresources. The counter in the top strip reports the
real number of requests that tried to leave the machine. It reads `NET 0`
because it is 0, and it turns red if that ever changes.

Nothing is minified. Open any page in a text editor and read it.

## Running it

There is no build. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Every tool also works opened directly from disk (`file://`), with two
exceptions: the sample GPX track loads only over http, and clipboard access
needs a secure context.

## Support

These are free and always will be. If one of them saved you a job, a small
Monero donation is welcome and entirely optional.

```
8ACg45xXbJDMn68kJZzofM8JcUzbtasRXed45SnKXpfdXFSay19GSYd4kngj6ex6uqFBmxE3d81JtD3qpPq9ydzBDHbETXf
```

That is a dedicated subaddress for this project. The same address is in the
footer of every page, where clicking it opens your wallet directly.

To generate a scannable QR for it, use the [qr](qr/) tool in this repo: pick
**Crypto payment**, choose Monero, paste the address, and export an SVG.

## Forking this

The donation address lives in exactly one place, `shared/site.js`. If you fork
this, point it at your own with:

```bash
./set-donation.sh <your-monero-address> https://github.com/you/localtools
```

Use a dedicated subaddress rather than your primary address. Until one is set,
the footer shows a reminder instead of a donation link.

## Layout

```
index.html          landing page, lists the tools
shared/base.css     one stylesheet for everything
shared/site.js      telemetry strip, footer, network watchdog, donation address
scrub/ qr/ regex/ cron/ gpx/
                    one index.html each, self-contained apart from shared/
sample-track.gpx    demo data for the gpx tool
sample-photo.jpg    demo photo carrying GPS and a camera serial
```

Each tool page holds its own CSS and JavaScript inline. The only shared files
are the stylesheet and `site.js`, referenced with a relative path, so the whole
folder can be moved, zipped, or served from any subdirectory.

## Browser support

Anything current. The tools use canvas, `DOMParser`, `TextEncoder`, and pointer
events. `scrub` needs `canvas.toBlob`; `qr` needs `ClipboardItem` for the copy
button only, and falls back gracefully without it.

## Licence

MIT. See [LICENSE](LICENSE).
