---
layout: post
comments: true
title: "Weekend Project: Nine-Card Golf in Python (with an AI Opponent)"
tags: [weekend-project, python, ai, statistics]
excerpt: "If your family is anything like mine, you probably play a lot of card games over the holidays. One in particular that's become a tradition in my family is a game we like to call nines. The thing is, no one else calls it that."
date: 2020-01-05
---

_**Note:** While I didn't actually write this program during a weekend, I did complete it in just a few days, so I'm calling it a weekend project._

If your family is anything like mine, you probably play a lot of card games over the holidays. One in particular that's become a tradition in my family is a game we like to call nines. The thing is, no one else calls it that. I found this out when I googled "nines card game," and all I could find was [this game](https://en.wikipedia.org/wiki/Nines_(card_game)) that was nothing like ours. After some more googling, I discovered that my family's version of nines was more similar to another card game called golf, specifically a variant called [nine-card golf](https://en.wikipedia.org/wiki/Golf_(card_game)#Nine-card_golf). According to Wikipedia, the game goes like this:

1. At the beginning of each round, each players arranges nine cards into a three-by-three grid, face down, and chooses two to turn over.
2. On their turn, each player must take the top card from either the face-down draw pile (what Wikipedia calls the "stock" pile) or the face-up discard pile.
3. If the player takes a card from the draw pile, they must choose either to keep or to discard it. If they discard it, they may choose to turn over one of the face-down cards in their hand.
4. If the player chooses to keep the card they drew, or if they take a card from the discard pile, they must swap it for one of the cards in their hand.
5. The round continues until a player "knocks" instead of taking their turn, at which point the other players each get one more turn.
6. The player with the fewest points at the conclusion of the round wins. Kings are worth zero points, jacks and queens ten, and number cards their face value. Three cards of the same rank in a row, column, or diagonal counts as zero points, and a two-by-two block of cards of the same rank counts as negative 25 points.

Our version has a few modifications, though, namely the following:

- Even if a player discards the card they drew, they cannot turn over a card in their hand.
- The round concludes only when a player "goes out," that is, turns over their last card.
- Each player chooses two cards, not three, to turn over at the beginning of the round.
- Three cards of the same rank in a column count as zero points, but not if they're in a row or a diagonal.
- No bonus is awarded for a two-by-two block of cards of the same rank.

Lately I've been working on a fairly large project that's mainly web-based (more on that in a future post), which means I've had to wrestle with all the headaches and maddening idiosyncrasies of cross-browser JavaScript development, not to mention CSS. Last week, I found myself in desperate need of a break, so I decided to write a command-line version of nines (or nine-card golf, as it were) in my language of choice, [Python](https://www.python.org/).

The first thing I did was open up IDLE and begin hammering away.

The second thing I did was switch to Atom. Sorry, [Guido](https://en.wikipedia.org/wiki/Guido_van_Rossum), but IDLE sucks.

Writing the code for the game itself was easy enough. All it needed to do was repeatedly loop through a list of players, rendering their hands as ASCII art, like this:

```
+--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+
|A | |K | |Q | |J | |2 | |3 | |4 | |5 | |6 | |7 | |8 | |9 | |10|
+--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+ +--+
```

...and soliciting user input as needed (**Python standard library tip:** [`itertools.cycle()`](https://docs.python.org/3/library/itertools.html#itertools.cycle) lets you iterate through the items in a list indefinitely, going back to the beginning of the list each time you reach the last item).

But I also wanted to create a computer opponent, and this proved somewhat more challenging for the general reason that manufacturing high-quality input tends to be more difficult than evaluating existing input. That is, it's harder to figure out the move that will win the game than it is to determine whether or not a given move results in victory; in the former case, the decision tree is a lot bigger.

I wanted it to be clear to anyone who read the source code that the computer didn't have any sort of informational advantage over the user, so I brushed up on a nifty little feature of Python's called [properties](https://docs.python.org/3/library/functions.html#property). Properties are attributes with custom getter methods. They also allow you define your own setter and deleter methods. This is particularly useful if you want to hide the value of an attribute unless a certain condition is met, like so:

```python
class Card:
    def __init__(self, rank, face_up=False):
        self._rank = rank
        self.face_up = face_up

    @property
    def rank(self):
        if self.face_up: return self._rank

    @rank.setter
    def rank(self, value):
        self._rank = value
```

In the example above, if you try to access the `rank` attribute of a `Card` instance whose `face_up` value is `False`, you will get `None`. This ensures that the AI can only see the ranks of cards that are face-up, just like the user (provided that the computer never cheats using the card's `_rank` attribute, which a quick inspection of the source code would easily detect).

As an aside, properties happen to be one of the few language features whose JavaScript implementation I actually prefer to Python's. Since _property_ has a different meaning in JavaScript (akin to attributes in Python), the analogous feature in JavaScript is referred to simply as [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set). The equivalent JavaScript code for the above Python snippet looks like this:

```javascript
class Card {
  constructor(rank, faceUp) {
    this._rank = rank;
    this.faceUp = faceUp || false;
  }

  get rank() {
    if (this.faceUp) return this._rank;
  }

  set rank(value) {
    this._rank = value;
  }
}
```

See how much more succinct and readable that is?

Anyway, once I started thinking about how to implement an AI opponent, it quickly became apparent to me that I needed to change the way the game solicited input from each player.

The game collects a few different types of player input:

- At the beginning of the round, it asks each player for the column and row of the cards they would like to turn over.
- Afterwards, the game begins each turn by asking the player whether they would like to take a card from the draw pile or the discard pile.
- If the player draws, they have the option either to keep the card they drew or to discard it.
- If the player keeps their card (or if they took a card from the discard pile), they must choose where to place it (column and row).

In early versions of the game, I had identified the type of input needed by printing a question such as

```
In which column (1-3) do you want to turn over a card?
```

or

```
Do you want to KEEP or DISCARD your FIVE?
```

This works fine for human players, but what about AI? It makes a lot more sense for the game to pass a variable to the player describing the input it needs and let the player figure out how to obtain that input. That way, a `Player` instance (which represents a human player) can print the appropriate prompt for the user to read and respond to, while an `AIPlayer` can route the input request to a specific method.

So I defined a series of queries for the game to pass to each player, like so:

```python
class Game:
    (TURN_OVER, DRAW_OR_DISCARD,
     KEEP_OR_DISCARD, PLACE) = range(4)
    ...
```

This solved the problem of identifying what type of input the computer was supposed to produce, but it still needed a way to actually generate that input. The computer has to make two main types of decisions:

- Whether or not it wants a card
- Where it wants to put that card

Since these two decisions involve a lot of the same logic, it makes sense to perform them simultaneously. (Admittedly, this is a fact that I did not catch onto right away.) We can then boil the two decisions down into one question that the computer should ask itself about every card it encounters:

_Do I want this card, and if so, where do I want to put it?_

What factors should the computer consider when answering this question? Here are a few:

- Do I have more than one face-down card?
- Have any of my opponents gone out, making this my final turn?
- What is the combined value of my face-up cards?
- What is the lowest possible score of any of my opponents?
- Can I replace a face-down card without going out and losing?
- Do I already have two cards of the same rank as this card in a column (in which case I probably want to put this card in that column)?
- Does this card have a lower expected value than any of the cards I'm currently holding? (Expected value is defined as the value of a face-up card or the mean value of all cards in the deck for a face-down card.)
- Do I have any cards of the same rank as this card?

Some of these factors take precedence over others. Say my hand looks like this:

```
+--+ +--+
|K | |  |
+--+ +--+
+--+ +--+
|4 | |10|
+--+ +--+
+--+ +--+
|4 | |  |
+--+ +--+
```

If I draw a four, I'm going to want to put it in the top row of the left column, where my king is now, to make three of a kind. I don't want to replace my ten, even though four is much lower than ten.

Or say my hand and my opponent's look like this:

```
My hand:
+--+ +--+ +--+
|2 | |A | |3 |
+--+ +--+ +--+
+--+ +--+ +--+
|5 | |K | |3 |
+--+ +--+ +--+
+--+ +--+ +--+
|5 | |4 | |  |
+--+ +--+ +--+

Opponent's hand:
+--+
|K |
+--+
+--+
|  |
+--+
+--+
|  |
+--+
```

Even if I draw a three, I shouldn't put it in my rightmost column because that would make me go out, and my opponent will probably end up with fewer points than me.

The algorithm, then, should evaluate certain criteria before others. And that it does. Broadly speaking, it first checks if it can go out and win, then searches for columns that already have two cards of the same rank as the new card, then assembles a list of positions where the expected value of the current card is greater than that of the new card. If this list turns out to be empty, the card is rejected. Otherwise, the algorithm scans the list for columns that already have one card of the same rank as the new card or, if no such columns exist, that do not already have two of a kind. Finally, it takes the list of candidate positions and chooses the one where the current card has the highest expected value. If more than one position shares the maximum expected value, the algorithm chooses the one whose column has the fewest overturned cards.

To test out the AI, I pitted it against a seasoned nines player, myself. In a series of ten consecutive rounds, I won six, and the computer four. A [chi-square analysis](https://en.wikipedia.org/wiki/Chi-squared_test) of the results confirms that this is not a significant difference:

<figure>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Me</th>
        <th>Computer</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Expected number of wins, <i>e</i></td>
        <td style="text-align: right">5</td>
        <td style="text-align: right">5</td>
      </tr>
      <tr>
        <td>Observed number of wins, <i>o</i></td>
        <td style="text-align: right">6</td>
        <td style="text-align: right">4</td>
      </tr>
      <tr>
        <td><i>o</i> − <i>e</i></td>
        <td style="text-align: right">1</td>
        <td style="text-align: right">−1</td>
      </tr>
      <tr>
        <td>(<i>o</i> − <i>e</i>)<sup>2</sup></td>
        <td style="text-align: right">1</td>
        <td style="text-align: right">1</td>
      </tr>
      <tr>
        <td>(<i>o</i> − <i>e</i>)<sup>2</sup>/<i>e</i></td>
        <td style="text-align: right">0.2</td>
        <td style="text-align: right">0.2</td>
      </tr>
      <tr>
        <td>χ<sup>2</sup></td>
        <td colspan="2" style="text-align: right">0.4</td>
      </tr>
      <tr>
        <td>Degrees of freedom</td>
        <td colspan="2" style="text-align: right">1</td>
      </tr>
      <tr>
        <td>p-value</td>
        <td colspan="2" style="text-align: right">0.5271</td>
      </tr>
    </tbody>
  </table>
</figure>

<figure>
  <img
      alt="A chi-square distribution with one degree of freedom."
      src="/images/nines-results-chi-square.png">
  <figcaption>
    A chi-square distribution with one degree of freedom. The shaded area represents the probability that an outcome at least as extreme as the one we observed would occur simply by chance, assuming the null hypothesis, that the computer and I are equally skilled at playing nines, is true.
    (<a href="http://courses.atlas.illinois.edu/spring2016/STAT/STAT200/pchisq.html">Image source</a>)
  </figcaption>
</figure>

The computer, in other words, is about as good at nines as I am.

[View this project's source code on GitHub](https://github.com/jackmaurer/nines)
