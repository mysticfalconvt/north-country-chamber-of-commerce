# Chamber of commerce app

## Punch list of updates

- Business account creation
    - Update this so that it doesn't use stripe. We still need a business checkout flow basically and then when they are done it will ask them to send a check and it will create their account for the user and the business's record. We need to make sure that in the creation process it also includes the business logo upload
    - We want these to then email all chamber admins and give them a link to a page where they can approve or deny (they have to be logged in)
    - Make sure businesses can be in multiple categories. (This might exist but not positive)
    - Business users can log in and see their info and edit their info (But their expiration date can't be done by the business)
        - They need their own simpler admin view, I think this exists
    - Business membership tiers are different than what exists now in the fixture we have for seeding. Update this to be bronze, silver, gold, platinum.  We need to update the fixture and then we can reseed it. In the business views for public the silver, gold, and platinum need a badge. I think now we just have featured badges but that can go away and only use the 3 upper tiers for badges.  In the view of all businesses they will be sorted by tier so higher tiers appear first  and then sort alphabetically

- Next new feature is banners. I would like a way for chamber admins to add something like a banner that shows up at the top of the page for things like (We are closed today 2/2/26 for snow) These should be creatable and then have date to show that should be a range so like it could last a week, or just today and then dissapear.  These need to be super easy to create so probably a nice button at the top of the view for admin editing.

- The announcements section doesnt show anything. We have a link for a page called /news this should show these.  I would also like to create a mailing list signup somewhere. This can be on the main page.  Or just create a page at /mailSignup that will have a form for signing up.  That means we will also need a /unsubscribe page for people clicking the unsubscribe button.
    - I want the chamber admins to have the ability in the admin page to send out the latest announcment as a nicely made email with whatever is in that. It should also include the next 5 upcoming events if there are 5. Actually maybe limit this to only include things in the next 45 days or somehing like that.  

- We want an hours page. This can probably just be in the fixtures for a nice page, Maybe on the /about page. I dont think we have a fixture for that. Can we add that.  