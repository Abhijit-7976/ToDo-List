const express = require("express")
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

mongoose.connect(
  "mongodb+srv://admin:GSTZMGT2h787TsLk@node-mongodb.ptcuv7r.mongodb.net/todolistDB?retryWrites=true&w=majority"
)

const taskSchema = new mongoose.Schema({
  name: String,
})

const Task = mongoose.model("Task", taskSchema)

const listSchema = mongoose.Schema({
  name: String,
  listItems: [taskSchema],
})

const List = mongoose.model("List", listSchema)

const defaultItems = [
  { name: "Welcome to your todolist" },
  { name: "Hit the + button to add a new task" },
  { name: "<-- Hit this to delete a task" },
]

app.get("/", async (req, res) => {
  const items = await Task.find()

  if (items.length === 0) {
    await Task.insertMany(defaultItems)
  }

  res.render("list", { heading: "Today", listItems: items })
})

app.get("/:listName", async (req, res) => {
  const listName = _.capitalize(req.params.listName)

  const findRes = await List.findOne({ name: listName })

  if (listName !== "Favicon.ico") {
    if (!findRes) {
      const list = new List({
        name: listName,
        listItems: defaultItems,
      })
      await list.save()
      res.redirect(`/${listName}`)
    } else {
      res.render("list", {
        heading: findRes.name,
        listItems: findRes.listItems,
      })
    }
  }
})

app.post("/", async (req, res) => {
  const itemName = req.body.newItem
  const listTitle = req.body.list
  const newTask = new Task({
    name: itemName,
  })

  if (listTitle === "Today") {
    await newTask.save()
    res.redirect("/")
  } else {
    const findRes = await List.findOne({ name: listTitle })
    findRes.listItems.push(newTask)
    await findRes.save()
    res.redirect(`/${listTitle}`)
  }
})

app.post("/delete", async (req, res) => {
  const itemId = req.body.checkbox
  const listTitle = req.body.listName

  if (listTitle === "Today") {
    await Task.deleteOne({ _id: itemId })
    res.redirect("/")
  } else {
    await List.updateOne(
      { name: listTitle },
      {
        $pull: { listItems: { _id: itemId } },
      }
    )
    res.redirect(`/${listTitle}`)
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log("server running on port 3000")
})
