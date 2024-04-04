// import { genSalt, hash } from 'bcrypt';

function submitbox(){
    alert("You have successfully signed up! Now, you can log in to your account");
    res.render("login")
}

// const form = document.querySelector('form')
// const nameError = document.querySelector('.name.error')
// const emailError = document.querySelector('.email.error')
// const passwordError = document.querySelector('.password.error')

// form.addEventListener('submit', async(e) => {
//     e.preventDefault()

//     nameError.textContent=""
//     emailError.textContent=""
//     passwordError.textContent=""

//     const name = form.name.value
//     const email = form.email.value
//     let password = form.password.value

//     const salt = await genSalt()
//     password = await hash(this.password, salt)

//     try{
//         const res = await fetch("/signup", {
//             method: 'POST',
//             body: JSON.stringify({name, email, password}),
//             headers:{'Content-Type': 'application/json'}
//         })

//         const data1 = await res.json()
//         console.log(data1)

//         if(data1.errors){
//             nameError.textContent = data1.errors.name
//             emailError.textContent = data1.errors.email
//             passwordError.textContent = data1.errors.password
//             console.log("in errors")
//             console.log(nameError.textContent)
//             console.log(emailError.textContent)
//             console.log(passwordError.textContent)
//         }
//         if(data1.user){
//             console.log("out of errors")
//             location.assign('/login')
//         }
//     }catch(err){
//         console.log(err)
//     }
// })
