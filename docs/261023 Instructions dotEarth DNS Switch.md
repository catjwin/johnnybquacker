# Pointing johnnybquacker.com at the new site

**For:** Dad (johnnybquacker.com account holder at dotEarth)
**Time needed:** about 10 minutes, then up to a day for it to take effect

## What this does

The new site is already built and running. This change tells the internet to show the new site when someone types johnnybquacker.com.

- You keep owning the domain at dotEarth. Nothing is transferred.
- Your **email at johnnybquacker.com is not affected**, as long as you only change the records listed below.
- You can undo it at any time by putting the old numbers back.

## Before you start

1. Log in to your dotEarth account.
2. Find **johnnybquacker.com** and open its **DNS** settings. Depending on the screen, this may be called *DNS Records*, *Manage DNS*, *Zone File* or *Advanced DNS*.
3. **Take a screenshot of the whole list of records** before changing anything, and send it to me. That's our undo button.

If the DNS settings are greyed out or say the domain is "connected to your website builder", stop there and see *If you get stuck* below.

## The change: two records

Edit these two records. Change only the **value** (sometimes labelled *Points to*, *Address* or *IP*). Leave everything else as it is.

| Type | Host / Name | Old value | **New value** |
|---|---|---|---|
| A | `@` (or blank, or `johnnybquacker.com`) | 216.251.43.98 | **82.165.200.216** |
| A | `www` | 216.251.43.98 | **82.165.200.216** |

If there is a TTL setting, the lowest option (for example 1 hour or 3600) is fine.

Save the changes.

## Do not touch

- Any **MX** records (these handle your email)
- Any **TXT** records (one of these helps your email get delivered)
- The **nameservers** (`ns1.meganameservers.com` and so on)
- Anything else on the list

## Afterwards

- Let me know when you've saved it. It usually starts working within an hour, but it can take up to a day.
- Until then, some people will still see the old site. That's normal.
- I'll confirm when the new site is showing at johnnybquacker.com with the padlock (https).

## Don't cancel anything yet

**Keep your dotEarth account and the domain registration.** You'll want to cancel the website builder plan eventually, but wait until I confirm the new site is live. Then, before cancelling, ask dotEarth to confirm in writing that cancelling the website builder will **not** cancel:

1. the domain registration,
2. the DNS settings above, or
3. your email at johnnybquacker.com.

## If you get stuck

Contact dotEarth support and send them this:

> Please update the DNS for my domain johnnybquacker.com. Set the A record for the root domain (@) and the A record for www to **82.165.200.216**. Please do not change my MX, TXT or nameserver records. My email must keep working. If my website builder is locking these records, please disconnect the builder from the domain first.
