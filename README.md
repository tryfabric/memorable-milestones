# Memorable Milestones
[![Memorable Milestones](https://res.cloudinary.com/m15y/image/upload/v1588977044/su/TJ5G67VHU/kmbjqinsp71vavcdth7j.svg)](https://github.com/instantish/memorable-milestones)

🍎🚲🌵🦆🥚🥏🍇🐴🦞🗺🍊🦔☀️🎾☂️🍉

An opinionated GitHub Action that puts your milestones on auto-pilot, using memorable emoji names.

**You won't have to create or close milestones again.**

Generates weekly milestones (up to 8 weeks out), rotating between 16 pre-selected and memorable emoji names.

Due dates are set to every Thursday.

Check out this project's [milestones page](https://github.com/instantish/memorable-milestones/milestones) to see what the generated ones look like.

You can also follow our [Twitter bot](https://twitter.com/memorable_bot) to be notified when milestones start and end! 💝

![Milestones](https://user-images.githubusercontent.com/1459660/81017934-4539da00-8e18-11ea-8dc0-3af3b1474944.png)


**Benefits:**

✅ easy one-time setup, with **no config needed**

✅ automatically keeps schedule **up to date**

✅ you don't have to come up with your own memorable names

✅ the schedule is **global**, so you can collaborate with external teams easily

✅ even **closes milestones** that have no more open issues or PRs, so you don't have to

## Milestones

There are 16 weekly milestones. Names and due dates are pre-determined, so there's no setup!

The milestone schedule is **global**, meaning the `🍉  Watermelon` sprint finishes on
August 27 2020 for everyone using this action. This makes it simple to collaborate across teams.

### Due dates

Milestones are weekly and the action will create 8 of them for 8 weeks out. The due dates are each Thursday.

### Names

The names are designed to be easy to remember and distinct. Using emojis triggers the parts
of our brains that are great at remembering pictures!

**What makes these milestones memorable?**

Here is the criteria used to *select* the 16 emojis:

- emoji picture is not too small or zoomed out
- emoji is not distractingly cutesy
- the correct name of the emoji should immediately come to mind when you see it
- knowing the emoji name, should be easy to find emoji and not confuse with another emoji
- shouldn't make you hungry 😂
- no scene-type emojis
- emojis used shouldn't look similar
- should have to do with nature or activities, not electronics
- shouldn't be too positive-associated or negative-associated
- shouldn't be strongly associated with a sprint type, like a 🧹 for cleanup sprint
- One word and ideally less than 3 syllables

**How is order determined?**

Here is the criteria used to *order* the 16 emojis:

- emojis of similar colour should not be next to each other
- ideally, emojis of the same category should not be next to each other (food, activity, nature, animal)
- names of emojis should be in alphabetical order so it's each to recall that apple was before bike

**How is name formatting determined?**

Names are one word and include the emoji and the name. Two spaces are put in between because that formatting
tends to look better on GitHub and on Slack with the Instantish integration.

**Cool, so what are the names?**

Here are the names, followed by first due date (future due dates are a multiple of 16 weeks from then):

`🍎  Apple` - May 14 2020
`🚲  Bike` - May 21 2020
`🌵  Cactus` - May 28 2020
`🦆  Duck` - June 4 2020 (@marissamarym's bday 🧁)
`🥚  Egg` - June 11 2020
`🥏  Frisbee` - June 18 2020
`🍇  Grape` - June 25 2020
`🐴  Horse` - July 2 2020
`🦞  Lobster` - July 9 2020
`🗺  Map` - July 16 2020
`🍊  Orange` - July 23 2020
`🦔  Porcupine` - July 30 2020
`☀️  Sun` - August 6 2020
`🎾  Tennis` - August 13 2020
`☂️  Umbrella` - August 20 2020
`🍉  Watermelon` - August 27 2020


## Functionality

This Action only creates or closes milestones (when they get to 100%). That means it doesn't
delete your current milestones or change their names or due dates. If a milestone with the exact same
name exists, it does not recreate it or edit it.

Have a holiday coming up or skipping a milestone? Just close it and it won't be recreated.

## Usage

Actions are "individual tasks that you can combine to create jobs and customize your workflow." You can use them by creating a file that ends in `.yml` in the `.github` directory of your repo. A nice convention is to create a directory within `.github` called `workflows`, but you can set it up any way you like.

Create a new file at the path `.github/workflows/milestones.yml` and copy the following verbatim:
```yaml
name: "Memorable milestones"
on:
  schedule:
  - cron: "*/30 * * * *"

jobs:
  memorable-milestones:
    runs-on: ubuntu-latest
    steps:
    - uses: instantish/memorable-milestones@2.0.1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```


See [action.yml](./action.yml) for the full list of options.

You can add a badge to your repo's README (like [![Memorable Milestones](https://res.cloudinary.com/m15y/image/upload/v1588977044/su/TJ5G67VHU/kmbjqinsp71vavcdth7j.svg)](https://github.com/instantish/memorable-milestones)):

```markdown
[![Memorable Milestones](https://res.cloudinary.com/m15y/image/upload/v1588977044/su/TJ5G67VHU/kmbjqinsp71vavcdth7j.svg)](https://github.com/instantish/memorable-milestones)
```

If you have questions about setting this up, feel free to reach out to hi@itsinstantish.com with subject line "Question about GitHub Action" 😊

## Action minutes

This is a rough estimate, but on average, this action takes <20s to run on Linux. Assuming it runs every 30 minutes and takes up to 30s, that's <24 minutes a day, or <744 minutes a month. This cost is per-repo.

GitHub's free plan allocates 2k minutes for free, the team plan allocates 3k, and enterprise allocates 50k.

If you run this once a day, (cron: `0 0 * * *`) instead of once every 30 minutes (cron: `*/30 * * * *`), it should use <15 minutes a month per repo, so you can configure it on up to ~100 repos without going over your free plan budget.

## Debugging

To see debug ouput from this action, you must set the secret `ACTIONS_STEP_DEBUG` to `true` in your repository. You can run this action in debug only mode (no actions will be taken on your milestones) by passing `debug-only` `true` as an argument to the action.

## Building and testing

Install the dependencies
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run pack
```

Run the tests :heavy_check_mark:
```bash
$ npm test
```

## More Resources

For more resources or tools to make issue tracking easier, check out [Instantish](https://itsinstantish.com) ⚡️ or check out [this doc](https://docs.google.com/document/d/1b2vrpmclGQqw7Prjm2o5a13J-orLhfSqffvY7SOmZi8/edit) for some thoughts on GitHub labels for small teams.
