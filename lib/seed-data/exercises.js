// Original descriptions/instructions written for TemprFit — not sourced or
// scraped from any third-party exercise database. Sets/reps/rest are NOT
// stored here — see lib/prescription.js for the dynamic goal-based version.
//
// `media`: 16 of these 27 now borrow a start/finish photo pair from the
// Free Exercise DB (see lib/seed-data/exercise-library.json) where a close
// visual equivalent exists — see `mediaSourceNote` on each matched entry.
// The remaining exercises have no equivalent in that dataset and fall back
// to the placeholder icon in the UI, same as before.

export const exerciseSeed = [
  {
    "name": "Barbell Back Squat",
    "slug": "barbell-back-squat",
    "description": "A foundational lower-body compound lift that builds strength and size across the entire lower body.",
    "instructions": [
      "Set the bar on a rack at roughly chest height and step under it, resting it across your upper back.",
      "Unrack the bar, step back, and set your feet shoulder-width apart with toes slightly out.",
      "Brace your core, bend at the hips and knees together, and lower until your thighs are at least parallel to the floor.",
      "Drive through your midfoot to stand back up, keeping your chest up throughout."
    ],
    "equipment": [
      "barbell",
      "squat rack"
    ],
    "movementPattern": "squat",
    "difficulty": "intermediate",
    "environment": [
      "gym"
    ],
    "safetyNotes": [
      "Keep the bar path over your midfoot.",
      "Never round your lower back under load."
    ],
    "commonMistakes": [
      "Knees caving inward",
      "Heels lifting off the floor",
      "Cutting depth short"
    ],
    "formTips": [
      "Screw your feet into the floor to keep knees tracking over toes.",
      "Keep your ribcage stacked over your pelvis."
    ],
    "variations": [
      "Front Squat",
      "Box Squat"
    ],
    "progressions": [
      "Pause Squat",
      "Pin Squat"
    ],
    "regressions": [
      "Goblet Squat",
      "Bodyweight Squat"
    ],
    "targetMuscles": {
      "primary": "quads",
      "secondary": [
        "glutes",
        "hamstrings",
        "abdominals"
      ]
    },
    "category": "powerlifting",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
        "alt": "Barbell Back Squat"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg",
        "alt": "Barbell Back Squat"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Barbell Squat\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Goblet Squat",
    "slug": "goblet-squat",
    "description": "A beginner-friendly squat variation using a single dumbbell or kettlebell held at chest height.",
    "instructions": [
      "Hold a dumbbell or kettlebell vertically against your chest with both hands.",
      "Stand with feet just outside shoulder width.",
      "Squat down between your knees, keeping your torso upright.",
      "Push through your feet to return to standing."
    ],
    "equipment": [
      "dumbbell"
    ],
    "movementPattern": "squat",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym"
    ],
    "safetyNotes": [
      "Keep the weight close to your chest to avoid leaning forward."
    ],
    "commonMistakes": [
      "Rounding the upper back",
      "Rising onto toes"
    ],
    "formTips": [
      "Drive your knees out in line with your toes."
    ],
    "progressions": [
      "Barbell Back Squat",
      "Front Squat"
    ],
    "regressions": [
      "Bodyweight Squat"
    ],
    "targetMuscles": {
      "primary": "quads",
      "secondary": [
        "glutes",
        "abdominals"
      ]
    },
    "category": "bodybuilding",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Push-Up",
    "slug": "push-up",
    "description": "A classic bodyweight pressing movement for chest, shoulders, and triceps.",
    "instructions": [
      "Start in a plank position with hands slightly wider than shoulder-width.",
      "Lower your body until your chest nearly touches the floor, keeping elbows at roughly 45 degrees.",
      "Press back up to the starting position, keeping your body in a straight line."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "push",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym",
      "outdoor"
    ],
    "safetyNotes": [
      "Keep hips level — avoid sagging or piking."
    ],
    "commonMistakes": [
      "Flaring elbows straight out to the sides",
      "Sagging hips"
    ],
    "formTips": [
      "Squeeze your glutes and brace your core to keep a straight line head to heel."
    ],
    "variations": [
      "Incline Push-Up",
      "Diamond Push-Up",
      "Decline Push-Up"
    ],
    "progressions": [
      "Weighted Push-Up",
      "Archer Push-Up"
    ],
    "regressions": [
      "Incline Push-Up",
      "Knee Push-Up"
    ],
    "targetMuscles": {
      "primary": "chest",
      "secondary": [
        "triceps",
        "shoulders",
        "abdominals"
      ]
    },
    "category": "calisthenics",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
        "alt": "Push-Up"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/1.jpg",
        "alt": "Push-Up"
      }
    ],
    "publicationStatus": "published"
  },
  {
    "name": "Burpee",
    "slug": "burpee",
    "description": "A full body cardiovascular exercise that builds explosive power and endurance.",
    "instructions": [
      "Start in a standing position.",
      "Drop into a squat position and place your hands on the ground.",
      "Kick your feet back to a plank position, keeping your arms extended.",
      "Immediately return your feet to the squat position.",
      "Stand up from the squat position."
    ],
    "equipment": ["bodyweight"],
    "movementPattern": "full-body",
    "difficulty": "intermediate",
    "environment": ["home", "gym", "outdoor"],
    "safetyNotes": ["Pace yourself to avoid burning out too quickly."],
    "commonMistakes": ["Sagging the hips during the plank phase"],
    "formTips": ["Focus on a smooth, continuous motion."],
    "targetMuscles": {
      "primary": "quads",
      "secondary": ["chest", "shoulders", "abdominals"]
    },
    "category": "cardio",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee/0.jpg",
        "alt": "Burpee"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee/1.jpg",
        "alt": "Burpee"
      }
    ],
    "publicationStatus": "published"
  },
  {
    "name": "Sit-Up",
    "slug": "sit-up",
    "description": "A basic abdominal exercise that strengthens the core.",
    "instructions": [
      "Lie on your back with your knees bent and feet flat on the floor.",
      "Place your hands behind your head or crossed over your chest.",
      "Lift your upper body all the way up until it forms a V-shape with your thighs.",
      "Lower yourself back to the starting position."
    ],
    "equipment": ["bodyweight"],
    "movementPattern": "flexion",
    "difficulty": "beginner",
    "environment": ["home", "gym", "outdoor"],
    "safetyNotes": ["Avoid pulling on your neck if your hands are behind your head."],
    "commonMistakes": ["Using momentum instead of abdominal strength"],
    "formTips": ["Keep your feet planted firmly on the ground."],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": []
    },
    "category": "calisthenics",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sit-up/0.jpg",
        "alt": "Sit-Up"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sit-up/1.jpg",
        "alt": "Sit-Up"
      }
    ],
    "publicationStatus": "published"
  },
  {
    "name": "Barbell Bench Press",
    "slug": "barbell-bench-press",
    "description": "The primary horizontal pressing lift for building chest, shoulder, and triceps strength.",
    "instructions": [
      "Lie on a flat bench with eyes roughly under the bar, feet flat on the floor.",
      "Grip the bar slightly wider than shoulder-width and unrack it over your chest.",
      "Lower the bar under control to your mid-chest.",
      "Press back up to full elbow extension."
    ],
    "equipment": [
      "barbell",
      "bench"
    ],
    "movementPattern": "push",
    "difficulty": "intermediate",
    "environment": [
      "gym"
    ],
    "safetyNotes": [
      "Use a spotter or safety bars when working near your limit."
    ],
    "commonMistakes": [
      "Bouncing the bar off the chest",
      "Flaring elbows to 90 degrees"
    ],
    "formTips": [
      "Keep your shoulder blades pulled together and down throughout the lift."
    ],
    "variations": [
      "Incline Bench Press",
      "Close-Grip Bench Press"
    ],
    "regressions": [
      "Dumbbell Bench Press",
      "Push-Up"
    ],
    "targetMuscles": {
      "primary": "chest",
      "secondary": [
        "triceps",
        "shoulders"
      ]
    },
    "category": "powerlifting",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
        "alt": "Barbell Bench Press"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg",
        "alt": "Barbell Bench Press"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Barbell Bench Press - Medium Grip\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Dumbbell Bench Press",
    "slug": "dumbbell-bench-press",
    "description": "A bench press variation using dumbbells for a greater range of motion and independent arm control.",
    "instructions": [
      "Lie on a flat bench holding a dumbbell in each hand at chest level.",
      "Press both dumbbells straight up until your arms are extended.",
      "Lower under control back to the starting position."
    ],
    "equipment": [
      "dumbbell",
      "bench"
    ],
    "movementPattern": "push",
    "difficulty": "beginner",
    "environment": [
      "gym",
      "home"
    ],
    "commonMistakes": [
      "Letting the dumbbells drift too far apart at the top"
    ],
    "formTips": [
      "Keep a slight arch in your lower back and drive your feet into the floor."
    ],
    "regressions": [
      "Push-Up"
    ],
    "targetMuscles": {
      "primary": "chest",
      "secondary": [
        "triceps",
        "shoulders"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press_with_Neutral_Grip/0.jpg",
        "alt": "Dumbbell Bench Press"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press_with_Neutral_Grip/1.jpg",
        "alt": "Dumbbell Bench Press"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Dumbbell Bench Press with Neutral Grip\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Deadlift",
    "slug": "deadlift",
    "description": "A full-body hinge lift that builds posterior chain strength — often considered the ultimate test of total-body strength.",
    "instructions": [
      "Stand with feet hip-width apart, bar over midfoot.",
      "Hinge down and grip the bar just outside your knees.",
      "Set your back flat, chest up, and brace your core.",
      "Drive through your feet and extend your hips to stand tall, keeping the bar close to your body.",
      "Reverse the motion under control to lower the bar back down."
    ],
    "equipment": [
      "barbell"
    ],
    "movementPattern": "hinge",
    "difficulty": "advanced",
    "environment": [
      "gym"
    ],
    "safetyNotes": [
      "Never let your lower back round under load — stop the set if form breaks down."
    ],
    "commonMistakes": [
      "Rounding the lower back",
      "Letting the bar drift away from the shins"
    ],
    "formTips": [
      "Think \"push the floor away\" rather than \"pull the bar up\"."
    ],
    "variations": [
      "Romanian Deadlift",
      "Sumo Deadlift",
      "Trap Bar Deadlift"
    ],
    "regressions": [
      "Romanian Deadlift",
      "Kettlebell Deadlift"
    ],
    "targetMuscles": {
      "primary": "hamstrings",
      "secondary": [
        "glutes",
        "back",
        "abdominals",
        "forearms"
      ]
    },
    "category": "powerlifting",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
        "alt": "Deadlift"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/1.jpg",
        "alt": "Deadlift"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Barbell Deadlift\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Romanian Deadlift",
    "slug": "romanian-deadlift",
    "description": "A hip-hinge variation that emphasizes the hamstrings and glutes with a shorter range of motion than a conventional deadlift.",
    "instructions": [
      "Hold a barbell or pair of dumbbells at hip level, feet hip-width apart.",
      "With a soft bend in the knees, hinge at the hips and push your hips back.",
      "Lower the weight along your legs until you feel a stretch in your hamstrings.",
      "Drive your hips forward to return to standing."
    ],
    "equipment": [
      "barbell"
    ],
    "movementPattern": "hinge",
    "difficulty": "intermediate",
    "environment": [
      "gym",
      "home"
    ],
    "commonMistakes": [
      "Squatting the weight down instead of hinging",
      "Rounding the back"
    ],
    "formTips": [
      "Keep the bar or dumbbells close, dragging along your thighs."
    ],
    "regressions": [
      "Bodyweight Hip Hinge"
    ],
    "targetMuscles": {
      "primary": "hamstrings",
      "secondary": [
        "glutes",
        "back"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift_from_Deficit/0.jpg",
        "alt": "Romanian Deadlift"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift_from_Deficit/1.jpg",
        "alt": "Romanian Deadlift"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Romanian Deadlift from Deficit\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Pull-Up",
    "slug": "pull-up",
    "description": "A vertical pulling bodyweight exercise that builds a strong, wide back.",
    "instructions": [
      "Grip a pull-up bar slightly wider than shoulder-width, palms facing away.",
      "Hang with arms fully extended.",
      "Pull yourself up until your chin clears the bar.",
      "Lower back down under control to a full hang."
    ],
    "equipment": [
      "pull-up bar"
    ],
    "movementPattern": "pull",
    "difficulty": "intermediate",
    "environment": [
      "gym",
      "home",
      "outdoor"
    ],
    "commonMistakes": [
      "Using momentum/kipping when trying to build strict strength",
      "Not reaching full arm extension at the bottom"
    ],
    "formTips": [
      "Initiate the pull by driving your elbows down toward your hips."
    ],
    "variations": [
      "Chin-Up",
      "Wide-Grip Pull-Up"
    ],
    "regressions": [
      "Lat Pulldown",
      "Band-Assisted Pull-Up",
      "Negative Pull-Up"
    ],
    "targetMuscles": {
      "primary": "back",
      "secondary": [
        "biceps",
        "forearms"
      ]
    },
    "category": "calisthenics",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Lat Pulldown",
    "slug": "lat-pulldown",
    "description": "A machine-based vertical pull that builds the same muscles as a pull-up with adjustable resistance.",
    "instructions": [
      "Sit at a lat pulldown machine and grip the bar wider than shoulder-width.",
      "Lean back very slightly and pull the bar down to your upper chest.",
      "Squeeze your back at the bottom, then let the bar rise under control."
    ],
    "equipment": [
      "cable machine"
    ],
    "movementPattern": "pull",
    "difficulty": "beginner",
    "environment": [
      "gym"
    ],
    "commonMistakes": [
      "Leaning back excessively and turning it into a row"
    ],
    "formTips": [
      "Drive your elbows down and back rather than pulling with your arms."
    ],
    "progressions": [
      "Pull-Up"
    ],
    "targetMuscles": {
      "primary": "back",
      "secondary": [
        "biceps"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
        "alt": "Lat Pulldown"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/1.jpg",
        "alt": "Lat Pulldown"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Wide-Grip Lat Pulldown\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Barbell Row",
    "slug": "barbell-row",
    "description": "A horizontal pulling compound lift for a thicker, stronger back.",
    "instructions": [
      "Hinge at the hips holding a barbell with an overhand grip, torso close to parallel with the floor.",
      "Pull the bar up to your lower ribs, driving your elbows back.",
      "Lower under control back to a full stretch."
    ],
    "equipment": [
      "barbell"
    ],
    "movementPattern": "pull",
    "difficulty": "intermediate",
    "environment": [
      "gym"
    ],
    "safetyNotes": [
      "Keep a neutral spine — avoid rounding under load."
    ],
    "commonMistakes": [
      "Using body momentum to heave the weight up"
    ],
    "formTips": [
      "Keep your core braced as if about to be punched."
    ],
    "regressions": [
      "Dumbbell Row",
      "Seated Cable Row"
    ],
    "targetMuscles": {
      "primary": "back",
      "secondary": [
        "biceps",
        "abdominals"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
        "alt": "Barbell Row"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/1.jpg",
        "alt": "Barbell Row"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Bent Over Barbell Row\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Overhead Press",
    "slug": "overhead-press",
    "description": "A standing vertical press that builds shoulder strength and total-body stability.",
    "instructions": [
      "Hold a barbell at shoulder height with hands just outside shoulder-width.",
      "Brace your core and glutes, then press the bar straight overhead.",
      "Lock out at the top with the bar over your midline.",
      "Lower back to the starting position under control."
    ],
    "equipment": [
      "barbell"
    ],
    "movementPattern": "push",
    "difficulty": "intermediate",
    "environment": [
      "gym"
    ],
    "safetyNotes": [
      "Avoid excessive lower-back arching — brace your core and glutes instead."
    ],
    "commonMistakes": [
      "Pressing the bar out in front instead of straight up"
    ],
    "formTips": [
      "Move your head slightly back and then through as the bar passes your face."
    ],
    "regressions": [
      "Dumbbell Shoulder Press",
      "Seated Shoulder Press"
    ],
    "targetMuscles": {
      "primary": "shoulders",
      "secondary": [
        "triceps",
        "abdominals"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg",
        "alt": "Overhead Press"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/1.jpg",
        "alt": "Overhead Press"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Standing Military Press\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Dumbbell Lateral Raise",
    "slug": "dumbbell-lateral-raise",
    "description": "An isolation movement that targets the side deltoids for shoulder width.",
    "instructions": [
      "Stand holding a dumbbell in each hand at your sides.",
      "With a slight bend in the elbows, raise both arms out to the sides until roughly shoulder height.",
      "Lower back down under control."
    ],
    "equipment": [
      "dumbbell"
    ],
    "movementPattern": "push",
    "difficulty": "beginner",
    "environment": [
      "gym",
      "home"
    ],
    "commonMistakes": [
      "Using momentum to swing the weight up",
      "Shrugging the shoulders up toward the ears"
    ],
    "formTips": [
      "Lead with your elbows, not your hands."
    ],
    "targetMuscles": {
      "primary": "shoulders",
      "secondary": []
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
        "alt": "Dumbbell Lateral Raise"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg",
        "alt": "Dumbbell Lateral Raise"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Side Lateral Raise\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Barbell Bicep Curl",
    "slug": "barbell-bicep-curl",
    "description": "A classic isolation exercise for building bicep size and strength.",
    "instructions": [
      "Stand holding a barbell with an underhand, shoulder-width grip.",
      "Keeping your elbows pinned to your sides, curl the bar up toward your shoulders.",
      "Lower back down under control to full extension."
    ],
    "equipment": [
      "barbell"
    ],
    "movementPattern": "pull",
    "difficulty": "beginner",
    "environment": [
      "gym",
      "home"
    ],
    "commonMistakes": [
      "Swinging the torso to generate momentum"
    ],
    "formTips": [
      "Keep your elbows locked at your sides throughout the movement."
    ],
    "variations": [
      "Dumbbell Curl",
      "Hammer Curl"
    ],
    "targetMuscles": {
      "primary": "biceps",
      "secondary": [
        "forearms"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg",
        "alt": "Barbell Bicep Curl"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/1.jpg",
        "alt": "Barbell Bicep Curl"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Barbell Curl\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Tricep Pushdown",
    "slug": "tricep-pushdown",
    "description": "A cable isolation exercise for the triceps.",
    "instructions": [
      "Stand at a cable machine with a rope or bar attachment set at chest height.",
      "Keeping your elbows pinned to your sides, push the attachment down until your arms are fully extended.",
      "Let it rise back under control without letting your elbows drift forward."
    ],
    "equipment": [
      "cable machine"
    ],
    "movementPattern": "push",
    "difficulty": "beginner",
    "environment": [
      "gym"
    ],
    "commonMistakes": [
      "Letting the elbows flare away from the body"
    ],
    "formTips": [
      "Imagine your elbows are hinged to your ribs."
    ],
    "targetMuscles": {
      "primary": "triceps",
      "secondary": []
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
        "alt": "Tricep Pushdown"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg",
        "alt": "Tricep Pushdown"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Triceps Pushdown\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Plank",
    "slug": "plank",
    "description": "An isometric core hold that builds trunk stability.",
    "instructions": [
      "Rest on your forearms and toes, elbows under your shoulders.",
      "Keep your body in a straight line from head to heels.",
      "Brace your core and hold the position for time."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "brace",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym",
      "outdoor"
    ],
    "commonMistakes": [
      "Letting the hips sag or pike up"
    ],
    "formTips": [
      "Squeeze your glutes and think about pulling your elbows toward your toes."
    ],
    "progressions": [
      "Weighted Plank",
      "Plank with Shoulder Taps"
    ],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": [
        "shoulders",
        "glutes"
      ]
    },
    "category": "calisthenics",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Hanging Leg Raise",
    "slug": "hanging-leg-raise",
    "description": "An advanced core exercise performed hanging from a bar, targeting the lower abs and hip flexors.",
    "instructions": [
      "Hang from a pull-up bar with arms fully extended.",
      "Keeping your legs straight or slightly bent, raise them until roughly parallel to the floor.",
      "Lower back down under control without swinging."
    ],
    "equipment": [
      "pull-up bar"
    ],
    "movementPattern": "flexion",
    "difficulty": "advanced",
    "environment": [
      "gym",
      "outdoor"
    ],
    "commonMistakes": [
      "Using momentum/swinging instead of controlled reps"
    ],
    "formTips": [
      "Focus on curling your pelvis up rather than just lifting your legs."
    ],
    "regressions": [
      "Lying Leg Raise",
      "Knee Raise"
    ],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": []
    },
    "category": "calisthenics",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Bicycle Crunch",
    "slug": "bicycle-crunch",
    "description": "A rotational core exercise that targets the abs and obliques.",
    "instructions": [
      "Lie on your back with hands behind your head and legs raised, knees bent.",
      "Bring one elbow toward the opposite knee while extending the other leg.",
      "Alternate sides in a pedaling motion."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "rotation",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym"
    ],
    "commonMistakes": [
      "Pulling on the neck with the hands"
    ],
    "formTips": [
      "Keep your lower back pressed into the floor throughout."
    ],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": []
    },
    "category": "calisthenics",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Walking Lunge",
    "slug": "walking-lunge",
    "description": "A unilateral lower-body exercise that builds leg strength and balance.",
    "instructions": [
      "Stand tall, then step forward into a lunge, lowering your back knee toward the floor.",
      "Push off your front foot to bring your back leg forward into the next lunge.",
      "Continue alternating legs as you move forward."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "lunge",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym",
      "outdoor"
    ],
    "commonMistakes": [
      "Letting the front knee cave inward",
      "Taking too short a step"
    ],
    "formTips": [
      "Keep your torso upright and your front shin roughly vertical."
    ],
    "variations": [
      "Dumbbell Walking Lunge",
      "Reverse Lunge"
    ],
    "targetMuscles": {
      "primary": "quads",
      "secondary": [
        "glutes",
        "hamstrings"
      ]
    },
    "category": "calisthenics",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/0.jpg",
        "alt": "Walking Lunge"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Walking_Lunge/1.jpg",
        "alt": "Walking Lunge"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Bodyweight Walking Lunge\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Bulgarian Split Squat",
    "slug": "bulgarian-split-squat",
    "description": "A challenging single-leg squat variation with the rear foot elevated.",
    "instructions": [
      "Stand a couple feet in front of a bench, resting one foot on it behind you.",
      "Lower your body by bending your front knee until your rear knee nearly touches the floor.",
      "Push through your front foot to return to standing."
    ],
    "equipment": [
      "bench"
    ],
    "movementPattern": "squat",
    "difficulty": "intermediate",
    "environment": [
      "gym",
      "home"
    ],
    "commonMistakes": [
      "Placing the front foot too close, limiting range of motion"
    ],
    "formTips": [
      "Keep most of your weight on your front heel."
    ],
    "regressions": [
      "Walking Lunge"
    ],
    "targetMuscles": {
      "primary": "quads",
      "secondary": [
        "glutes"
      ]
    },
    "category": "bodybuilding",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Hip Thrust",
    "slug": "hip-thrust",
    "description": "A glute-focused hinge variation performed with your upper back against a bench.",
    "instructions": [
      "Sit on the floor with your upper back against a bench, a barbell over your hips.",
      "Plant your feet and drive your hips up until your body forms a straight line from shoulders to knees.",
      "Squeeze your glutes at the top, then lower back down under control."
    ],
    "equipment": [
      "barbell",
      "bench"
    ],
    "movementPattern": "hinge",
    "difficulty": "intermediate",
    "environment": [
      "gym"
    ],
    "commonMistakes": [
      "Overextending the lower back at the top instead of squeezing glutes"
    ],
    "formTips": [
      "Tuck your chin slightly and keep your ribs down at lockout."
    ],
    "regressions": [
      "Glute Bridge"
    ],
    "targetMuscles": {
      "primary": "glutes",
      "secondary": [
        "hamstrings"
      ]
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
        "alt": "Hip Thrust"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/1.jpg",
        "alt": "Hip Thrust"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Barbell Hip Thrust\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Standing Calf Raise",
    "slug": "standing-calf-raise",
    "description": "An isolation exercise for the calves performed standing.",
    "instructions": [
      "Stand with the balls of your feet on a raised platform, heels hanging off.",
      "Rise up onto your toes as high as possible.",
      "Lower your heels below the platform level for a full stretch."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "push",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym"
    ],
    "commonMistakes": [
      "Bouncing rather than controlling the tempo"
    ],
    "formTips": [
      "Pause briefly at the top for a full contraction."
    ],
    "targetMuscles": {
      "primary": "calves",
      "secondary": []
    },
    "category": "bodybuilding",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
        "alt": "Standing Calf Raise"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg",
        "alt": "Standing Calf Raise"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Standing Calf Raises\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Kettlebell Swing",
    "slug": "kettlebell-swing",
    "description": "An explosive hip-hinge exercise that builds power and conditioning.",
    "instructions": [
      "Stand with feet shoulder-width apart, kettlebell on the floor in front of you.",
      "Hinge down and grip the kettlebell with both hands.",
      "Hike it back between your legs, then explosively drive your hips forward to swing it to chest height.",
      "Let it swing back down and repeat."
    ],
    "equipment": [
      "kettlebell"
    ],
    "movementPattern": "hinge",
    "difficulty": "intermediate",
    "environment": [
      "gym",
      "home",
      "outdoor"
    ],
    "safetyNotes": [
      "This is a hip-hinge, not a squat — avoid bending the knees excessively."
    ],
    "commonMistakes": [
      "Squatting the weight instead of hinging",
      "Using the arms to lift rather than hip drive"
    ],
    "formTips": [
      "Think of the movement as \"snapping\" your hips forward."
    ],
    "targetMuscles": {
      "primary": "glutes",
      "secondary": [
        "hamstrings",
        "abdominals",
        "back"
      ]
    },
    "category": "plyometrics",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/0.jpg",
        "alt": "Kettlebell Swing"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/1.jpg",
        "alt": "Kettlebell Swing"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"One-Arm Kettlebell Swings\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Burpee",
    "slug": "burpee",
    "description": "A full-body conditioning exercise combining a squat, plank, push-up, and jump.",
    "instructions": [
      "From standing, squat down and place your hands on the floor.",
      "Kick your feet back into a plank position.",
      "Perform a push-up, then jump your feet back to your hands.",
      "Explosively jump up with arms overhead."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "compound",
    "difficulty": "intermediate",
    "environment": [
      "home",
      "gym",
      "outdoor"
    ],
    "commonMistakes": [
      "Sagging hips during the plank/push-up phase"
    ],
    "formTips": [
      "Keep the movement quick but controlled — do not sacrifice the plank position."
    ],
    "regressions": [
      "Step-Back Burpee (no push-up)"
    ],
    "targetMuscles": {
      "primary": "full body",
      "secondary": [
        "chest",
        "quads",
        "abdominals"
      ]
    },
    "category": "plyometrics",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Mountain Climbers",
    "slug": "mountain-climbers",
    "description": "A dynamic core and cardio exercise performed from a plank position.",
    "instructions": [
      "Start in a high plank position, hands under shoulders.",
      "Drive one knee toward your chest, then quickly switch legs.",
      "Continue alternating at a brisk pace while keeping your hips level."
    ],
    "equipment": [
      "bodyweight"
    ],
    "movementPattern": "compound",
    "difficulty": "beginner",
    "environment": [
      "home",
      "gym",
      "outdoor"
    ],
    "commonMistakes": [
      "Letting the hips rise up, losing the plank position"
    ],
    "formTips": [
      "Keep your core braced as if about to be tapped in the stomach."
    ],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": [
        "shoulders",
        "quads"
      ]
    },
    "category": "cardio",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Jump Rope",
    "slug": "jump-rope",
    "description": "A classic cardio exercise that builds conditioning, coordination, and calf endurance.",
    "instructions": [
      "Hold the rope handles at hip height and swing it overhead.",
      "Jump just high enough to clear the rope as it passes under your feet.",
      "Keep a steady rhythm, landing softly on the balls of your feet."
    ],
    "equipment": [
      "jump rope"
    ],
    "movementPattern": "compound",
    "difficulty": "beginner",
    "environment": [
      "home",
      "outdoor",
      "gym"
    ],
    "commonMistakes": [
      "Jumping too high, wasting energy"
    ],
    "formTips": [
      "Keep jumps small and quick, rotating the rope from your wrists rather than your shoulders."
    ],
    "targetMuscles": {
      "primary": "calves",
      "secondary": [
        "abdominals"
      ]
    },
    "category": "cardio",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rope_Jumping/0.jpg",
        "alt": "Jump Rope"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rope_Jumping/1.jpg",
        "alt": "Jump Rope"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Rope Jumping\" (closest visual equivalent).",
    "publicationStatus": "published"
  },
  {
    "name": "Downward Dog",
    "slug": "downward-dog",
    "description": "A foundational yoga pose that stretches the hamstrings, calves, and shoulders while building body awareness.",
    "instructions": [
      "Start on hands and knees, then lift your hips up and back.",
      "Straighten your legs as much as comfortable, forming an inverted V shape.",
      "Press your chest toward your thighs and heels toward the floor.",
      "Hold, breathing steadily."
    ],
    "equipment": [
      "bodyweight",
      "yoga mat"
    ],
    "movementPattern": "stretch",
    "difficulty": "beginner",
    "environment": [
      "home",
      "studio"
    ],
    "commonMistakes": [
      "Rounding the back to force heels flat"
    ],
    "formTips": [
      "A slight bend in the knees is fine if your hamstrings are tight."
    ],
    "targetMuscles": {
      "primary": "full body",
      "secondary": [
        "hamstrings",
        "shoulders",
        "calves"
      ]
    },
    "category": "stretching",
    "media": [],
    "publicationStatus": "published"
  },
  {
    "name": "Cat-Cow Stretch",
    "slug": "cat-cow-stretch",
    "description": "A gentle spinal mobility flow that warms up the back and core.",
    "instructions": [
      "Start on hands and knees, wrists under shoulders, knees under hips.",
      "Inhale, dropping your belly and lifting your chest and tailbone (cow).",
      "Exhale, rounding your spine toward the ceiling and tucking your chin (cat).",
      "Flow between the two positions with your breath."
    ],
    "equipment": [
      "bodyweight",
      "yoga mat"
    ],
    "movementPattern": "stretch",
    "difficulty": "beginner",
    "environment": [
      "home",
      "studio"
    ],
    "formTips": [
      "Move slowly and let your breath lead the movement."
    ],
    "targetMuscles": {
      "primary": "abdominals",
      "secondary": [
        "back"
      ]
    },
    "category": "stretching",
    "media": [
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat_Stretch/0.jpg",
        "alt": "Cat-Cow Stretch"
      },
      {
        "type": "image",
        "url": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat_Stretch/1.jpg",
        "alt": "Cat-Cow Stretch"
      }
    ],
    "mediaSourceNote": "Photo borrowed from Free Exercise DB entry \"Cat Stretch\" (closest visual equivalent).",
    "publicationStatus": "published"
  }
]
