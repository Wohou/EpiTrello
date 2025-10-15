# EpiTrello - 3 stacks Benchmark

This document outlines three relevant and powerful technology stacks we could use to build a Trello-like application for our school project. Each stack includes a choice for the frontend (the user interface), the backend (the server logic), and the database (where data is stored).

---

## Stack 1: Integrated JavaScript Approach

This is the most recommended stack for this project due to its development speed and modern architecture. It uses a single framework for both the client and server, and a service that bundles the database with real-time features.

| Component | Technology | Why it's a good choice |
| :--- | :--- | :--- |
| **Frontend & Backend** | **Next.js (React)** | A powerful React framework that handles both the user interface and server logic (via API Routes) in a single project. This simplifies setup and deployment. |
| **Database & Real-time** | **Supabase** | An open-source alternative to Firebase. It provides a robust PostgreSQL database, user authentication. This massively accelerates backend development. |

**Key Advantage:** Building the project with supabase will accelerate the project, supabase handles all the data and the user authentification, and Next.js is a powerfull framework that can handle hte front & the back end.

---

## Stack 2: "MERN" Stack

This stack represents a more traditional architecture where the frontend and backend are separate applications. Could be an good choice for having more control over the back and front end.

| Component | Technology | Why it's a good choice |
| :--- | :--- | :--- |
| **Frontend** | **React (with Vite)** | The most popular frontend library. Using Vite to set up the project provides an extremely fast development experience. |
| **Backend** | **Node.js with Express.js**| A minimalist and flexible backend framework. It's the standard for building APIs with JavaScript and has a huge community and library ecosystem (npm). |
| **Database** | **MongoDB** | A NoSQL database that stores data in JSON-like documents. Often paired with Node.js because its data format maps very naturally to JavaScript objects. |
| **Real-time** | **Socket.IO** | To implement the real-time card moving feature, we could use a library like Socket.IO to manage WebSocket connections between the client and the Node.js server. |

**Key Advantage:** By choosing this stack we chose to have the ability to design and integrate a complete web architecture by connecting the frontend and backend from scratch, a key aspect of mastering full-stack development principles.

**See the [README Stack 2](./Benchmark/stack2-mern/README.md)** for more informations and how to test it (with docker !).

---

## Stack 3: The Python-Powered Alternative

This stack is a great option if we are more comfortable with Python or want to build our backend with a different language ecosystem.

| Component | Technology | Why it's a good choice |
| :--- | :--- | :--- |
| **Frontend** | **Vue.js** | A progressive JavaScript framework known for its gentle learning curve and excellent documentation. It's a major competitor. |
| **Backend** | **Python with Django** | A "batteries-included" Python framework that provides an admin panel, an ORM (Object-Relational Mapper), and user authentication system. It is very powerful and promotes rapid development. |
| **Database** | **PostgreSQL** | A powerful and highly respected open-source relational database. It's the preferred database for Django and is known for its reliability and data integrity. |

**Key Advantage:** Shows versatility by combining a JavaScript frontend with a powerful and structured Python backend, a very common pattern in the industry.

**See the [README Stack 3](./Benchmark/stack3-python/README.md)** for more informations and how to test it (with docker !).

---

## Final Recommendation

For our school project with the goal of creating a functional Trello clone efficiently, **Stack 1 (Next.js + Supabase) is the clear winner.**

The primary reason is **speed and focus**. Supabase abstracts away the most time-consuming parts of backend development (database setup, user authentication, real-time updates). This allows us to dedicate almost all of our time to building the core user-facing features of our Trello board, which is the most important part of the project and will save us time to breathe more life and our spirit into our project.
