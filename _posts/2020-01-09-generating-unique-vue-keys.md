---
layout: post
comments: true
title: "Generating Unique Keys for Vue Components"
tags: [javascript, vue, statistics]
excerpt: "I've been working a lot with Vue lately, and while it's generally been a pleasant experience, there's one challenge that I keep running into: generating unique component keys."
date: 2020-01-09
---

_**Note:** This post was updated on January 10, 2020 to include a brief explanation of why array indices shouldn't be used as keys._

I've been working a lot with [Vue](https://vuejs.org/) lately, and while it's generally been a pleasant experience, there's one challenge that I keep running into: generating unique component keys.

One of Vue's essential features is the [`v-for`](https://vuejs.org/v2/guide/list.html) loop, which allows you to render an element for each item in an array. In its documentation, Vue recommends that you use the [`key`](https://vuejs.org/v2/api/#key) attribute with `v-for` loops whenever possible to avoid reusing elements.

Why are keys a good idea? Take the following example, which displays a list of fruits as a series of `div` elements that turn red when clicked:

<p class="codepen" data-height="265" data-theme-id="light" data-default-tab="js,result" data-user="jackmaurer" data-slug-hash="KKwoJpx" style="height: 265px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="v-for without keys">
  <span>See the Pen <a href="https://codepen.io/jackmaurer/pen/KKwoJpx">
  v-for without keys</a> by jackmaurer (<a href="https://codepen.io/jackmaurer">@jackmaurer</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

To see what's wrong with the example, try clicking one of the fruit names and then adding a fruit. You'll notice that even when all of the items in the array move up an index, the red divs remain the same. That's because there are no keys, so Vue is assigning items to components based solely on their position in the array.

Now take a look at another, nearly identical example, this time with keys:

<p class="codepen" data-height="265" data-theme-id="light" data-default-tab="js,result" data-user="jackmaurer" data-slug-hash="ZEYxwLN" style="height: 265px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="v-for with keys">
  <span>See the Pen <a href="https://codepen.io/jackmaurer/pen/ZEYxwLN">
  v-for with keys</a> by jackmaurer (<a href="https://codepen.io/jackmaurer">@jackmaurer</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

Now, when you add a fruit, the components shift down along with the items in the array. Using keys can help you avoid all kinds of unwanted behavior in your application.

Vue's documentation specifies that keys should be numbers or strings, and here's the tricky part: all the keys in a list have to be different from one another. To see why, try adding a fruit in the above example, clicking it, and then adding another fruit. Because I used the fruit type as the key, the two cherry components have the same key, so Vue can't tell them apart. If we're going to have multiple fruits with the same type, then, we ought to find another key.

How about array indices? Unfortunately, this solution turns out to have the same problem as no key at all:

<p class="codepen" data-height="265" data-theme-id="light" data-default-tab="js,result" data-user="jackmaurer" data-slug-hash="povVvYV" style="height: 265px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="v-for with index as key">
  <span>See the Pen <a href="https://codepen.io/jackmaurer/pen/povVvYV">
  v-for with index as key</a> by jackmaurer (<a href="https://codepen.io/jackmaurer">@jackmaurer</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

So what can we use? In Python, this would be a no-brainer: just call the [`id()`](https://docs.python.org/3/library/functions.html#id) function, which returns a unique identifier for any object. Since that's not an option, another obvious solution would be to assign every fruit object an `id` property based on the time it was created, like so:

```javascript
class Fruit {
  constructor(type) {
    this.type = type;
    this.id = (new Date()).getTime();
  }
}
```

The issue with this method is that it doesn't work if two or more objects are created at the same time, which in many cases makes it pretty impractical.

What about a random number? This is probably an okay solution, but there's always a tiny chance that we'll get the same number for two different objects.[^1] Wouldn't it be nice if we could eliminate that possibility completely?

Of course, we can do just that. All we have to do is loop through the existing list items and check for a conflict:

```javascript
class Fruit {
  constructor(type, id) {
    this.type = type;
    this.id = id;
  }
}

class FruitBasket {
  constructor() {
    this.fruits = [];
  }

  getNewId() {
    do {
      const id = Math.random();
    } while (this.idExists(id));
  }

  idExists(id) {
    for (const fruit of this.fruits) {
      if (fruit.id === id) return true;
    }
    return false;
  }

  addFruit(type) {
    const fruit = new Fruit(type, this.getNewId());
    this.fruits.push(fruit);
  }
}
```

If we're checking for conflicts anyway, though, why do the identifiers have to be random? We can save a few lines of code, and a tiny sliver of memory, by making an object's ID a function of how many objects were created before it:

```javascript
class FruitBasket {
  constructor() {
    this.fruits = [];
    this.maxId = 0;
  }

  getNewId() {
    this.maxId++;
    return this.maxId;
  }

  addFruit(type) {
    const fruit = new Fruit(type, this.getNewId());
    this.fruits.push(fruit);
  }
}
```

And there you have it. A simple, efficient mechanism for generating unique object identifiers. Try it out in the demo below:

<p class="codepen" data-height="265" data-theme-id="light" data-default-tab="js,result" data-user="jackmaurer" data-slug-hash="gObeEOd" style="height: 265px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="v-for with smart keys">
  <span>See the Pen <a href="https://codepen.io/jackmaurer/pen/gObeEOd">
  v-for with smart keys</a> by jackmaurer (<a href="https://codepen.io/jackmaurer">@jackmaurer</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

I'll be back soon with more details on that big project I mentioned in [my last post](/2020/01/05/nine-card-golf.html).

[^1]: Admittedly, this probability is exceedingly small. Assuming that the numbers returned by `Math.random()` have about sixteen digits after the decimal point, the probability of a conflict in a system of one thousand objects is roughly 0.000000005%. The probability that at least one conflict will occur among one billion such systems is around five percent. So an unchecked random number is actually a perfectly acceptable solution, provided you're okay with a one-in-twenty-billion chance of a rendering glitch.
