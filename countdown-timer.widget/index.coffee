# Countdown Widget by Jay

command: ""

refreshFrequency: false

render: ->
  now = new Date()
  targetDate = new Date("2026-08-01T00:00:00")
  millisecondsLeft = targetDate - now
  daysLeft = Math.floor(millisecondsLeft / (1000 * 60 * 60 * 24))
  daysLeft = if daysLeft < 0 then 0 else daysLeft

  """<div class='widget'>
  <div class='title'>Days Left Until MS Application</div>
  <div class='count'>#{daysLeft}</div>
</div>"""

style: """
  .widget {
    position: absolute;
    top: 200px;
    left: 25px;
    font-family: -apple-system, sans-serif
    color: white
    text-align: center
    padding: 20px
    background: rgba(0, 0, 0, 0.7)
    border-radius: 15px
    width: 360px
  }

  .title
    font-size: 20px
    margin-bottom: 10px

  .count
    font-size: 48px
    font-weight: bold
"""
