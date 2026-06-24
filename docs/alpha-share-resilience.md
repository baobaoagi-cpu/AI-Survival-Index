# Alpha Share Resilience

## Purpose

LINE LIFF `shareTargetPicker` is the preferred sharing path, but it is not reliable enough to be the only path. Some users may be outside the LINE client, have an incomplete SSO session, use an older LINE app, or be on a device where the picker does not open.

The product must keep the sharing loop usable even when the native LINE friend picker fails.

## Sharing Flow

1. User taps a share button.
2. The app records `share_intent`.
3. The app tries `liff.shareTargetPicker()` with a text message and a LIFF invite URL.
4. If the picker opens, LINE handles friend or group selection.
5. If the picker fails or is unavailable:
   - Generate the best available invite URL.
   - Copy the invite URL to clipboard.
   - Record `share_copy_fallback`.
   - Show the fallback share panel.

## Fallback Share Panel

The fallback panel provides:

- The copied invite URL.
- A QR code for the invite URL.
- A retry button for the LINE friend picker.
- A copy-link button.
- A system-share button using `navigator.share` when available.

## Friend Link Rule

Friend relationships are not created from the LINE address book. LINE does not provide the user's complete friend list.

Relationships are created when:

```text
A shares an invite URL
B opens that URL
B logs in or completes the quiz
The API creates A <-> B friend links
```

If an invite URL is missing:

```text
invite exists -> use invite
ref profile id exists -> use ref
neither exists -> create only the user profile, not a friend link
```

## Event Names

- `share_intent`
- `share_picker_attempt`
- `share_picker_resolved`
- `share_picker_failed`
- `share_picker_blocked`
- `share_url_fast_fallback`
- `share_copy_fallback`
- `share_fallback_retry_clicked`
- `share_fallback_retry_failed`
- `share_fallback_copy_clicked`
- `share_fallback_system_clicked`
- `share_fallback_system_failed`
- `share_fallback_panel_closed`

## Notes

The current production-safe default uses a text message instead of Flex Message. A rich share card can be restored after the picker path is stable across test devices.
