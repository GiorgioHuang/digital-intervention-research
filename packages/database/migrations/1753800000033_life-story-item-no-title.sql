-- Up Migration
-- A memory has words, and does not have to have a name.
--
-- The owner's instruction (2026-09-07): "去掉title，所有的记忆和帖子，不需要
-- title，只要正文内容" — no titles on memories or posts, only the words.
-- A life story is somebody telling what happened to them; asking them to
-- title it first is a form to fill in before they can begin, and the
-- screens that read it drew the title larger than the writing it was
-- about.
--
-- The column is kept and made optional rather than dropped. Two reasons,
-- and neither is caution about the schema:
--
--  * every title already written was written BY A PARTICIPANT. It is
--    their words about their own life, in the same table as the rest of
--    them, and this platform does not delete somebody's writing because
--    a screen stopped drawing it (ADR-023, and the rule that runs
--    through every withdrawal on this platform: hidden is not deleted).
--  * a NULL says "no title was given", which is now the ordinary state.
--    An empty string would say a title was given and it was blank, which
--    is not what happened, and it would let a screen print '' as though
--    a memory had a name made of nothing.
--
-- Nothing reads the column from here on: the queries stopped selecting
-- it in the same change, so no title travels to any client, whether a
-- new memory has one or an old one does.

ALTER TABLE life_story.items ALTER COLUMN title DROP NOT NULL;

COMMENT ON COLUMN life_story.items.title IS
  'Historic. Participants are no longer asked for a title (owner, 2026-09-07); NULL on everything written since. Values written before that are kept because they are the participant''s own words, and are read by nothing.';

-- Down Migration
-- The old shape cannot say "no title was given", so rolling back has to
-- put SOMETHING in every row written since. It puts an empty string:
-- not a word of it is invented, which a generated title ("Untitled", the
-- first line of the memory) would be — text nobody wrote, sitting in
-- somebody's account of their own life and indistinguishable from what
-- they did write. Going up again leaves those empty strings alone rather
-- than guessing which of them were once NULL.
UPDATE life_story.items SET title = '' WHERE title IS NULL;
ALTER TABLE life_story.items ALTER COLUMN title SET NOT NULL;
