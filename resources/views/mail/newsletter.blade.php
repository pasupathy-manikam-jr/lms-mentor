<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;">
                    <tr>
                        <td style="padding:24px 32px;border-bottom:1px solid #e4e4e7;font-size:18px;font-weight:bold;">
                            {{ config('app.name') }}
                        </td>
                    </tr>
                    <tr>
                        {{-- The body is sanitized HTML written in the admin (App\Support\HtmlSanitizer). --}}
                        <td style="padding:24px 32px;font-size:15px;line-height:1.6;">{!! $body !!}</td>
                    </tr>
                    <tr>
                        <td style="padding:16px 32px 24px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
                            {{ __('You are receiving this because you subscribed to our newsletter or have an account with us.') }}
                            <a href="{{ $unsubscribeUrl }}" style="color:#71717a;">{{ __('Unsubscribe') }}</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
